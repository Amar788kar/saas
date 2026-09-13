package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"crm-btp/internal/audit"
	"crm-btp/internal/auth"
	"crm-btp/internal/clients"
	"crm-btp/internal/common"
	"crm-btp/internal/company"
	"crm-btp/internal/config"
	"crm-btp/internal/database"
	"crm-btp/internal/leads"
	"crm-btp/internal/middleware"
	"crm-btp/internal/rbac"
	"crm-btp/internal/timeline"
	"crm-btp/internal/user"
	"crm-btp/internal/visits"
	"crm-btp/pkg/token"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 1. Connect to PostgreSQL
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer db.Close()

	// Run migrations if schema is not initialized
	_ = db.RunMigrations("migrations/000001_init_schema.up.sql")
	_ = db.RunMigrations("migrations/000002_crm_schema.up.sql")
	// 2. Connect to Redis
	cache, err := database.NewRedisClient(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Fatal: Redis initialization failed: %v", err)
	}

	// 3. Security & Token Manager
	tokenMgr := token.NewTokenManager(cfg.JWTSecret, cfg.JWTIssuer, cfg.AccessExpiry, cfg.RefreshExpiry)

	// 4. Repositories
	auditSvc := audit.NewService(db.DB)
	companyRepo := company.NewRepository(db.DB)
	userRepo := user.NewRepository(db.DB)
	authRepo := auth.NewRepository(db.DB)
	clientRepo := clients.NewPostgresClientRepository(db.DB)
	leadRepo := leads.NewPostgresLeadRepository(db.DB)
	visitRepo := visits.NewPostgresVisitRepository(db.DB)
	timelineRepo := timeline.NewPostgresTimelineRepository(db.DB)

	// 5. Services
	companySvc := company.NewService(companyRepo, auditSvc)
	userSvc := user.NewService(userRepo, auditSvc)
	authSvc := auth.NewService(db.DB, authRepo, companyRepo, userRepo, tokenMgr, cache, auditSvc)
	clientSvc := clients.NewClientService(clientRepo)
	leadSvc := leads.NewLeadService(leadRepo)
	visitSvc := visits.NewVisitService(visitRepo)
	timelineSvc := timeline.NewTimelineService(timelineRepo)

	// 6. Handlers
	companyHdlr := company.NewHandler(companySvc)
	userHdlr := user.NewHandler(userSvc)
	authHdlr := auth.NewHandler(authSvc)
	clientHdlr := clients.NewHandler(clientSvc)
	leadHdlr := leads.NewHandler(leadSvc)
	visitHdlr := visits.NewHandler(visitSvc)
	timelineHdlr := timeline.NewHandler(timelineSvc)

	// 7. Gin Engine & Middlewares
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(middleware.RecoveryMiddleware())
	router.Use(middleware.SecurityHeaders())

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:4200", "http://localhost:80", "http://localhost", "http://127.0.0.1:4200"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Company-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	if os.Getenv("APP_ENV") != "production" {
		corsConfig.AllowAllOrigins = true
	}
	router.Use(cors.New(corsConfig))

	// Base API route group
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":      "UP",
				"environment": cfg.AppEnv,
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
			})
		})

		// Public Auth routes (with rate limiting)
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", middleware.RateLimiter(cache, 10, time.Minute), authHdlr.Register)
			authGroup.POST("/login", middleware.RateLimiter(cache, 15, time.Minute), authHdlr.Login)
			authGroup.POST("/refresh", authHdlr.Refresh)
			authGroup.POST("/logout", authHdlr.Logout)
		}

		// Authenticated & Tenant-Scoped routes
		protected := v1.Group("")
		protected.Use(middleware.Auth(tokenMgr))
		protected.Use(middleware.TenantContext())
		{
			// Auth User self routes
			protected.GET("/auth/me", authHdlr.Me)
			protected.PUT("/auth/password", authHdlr.ChangePassword)

			// Company (Tenant)
			compGroup := protected.Group("/company")
			{
				compGroup.GET("", companyHdlr.GetProfile)
				compGroup.PUT("", middleware.RequireRoles(rbac.RoleAdmin), companyHdlr.UpdateProfile)
			}

			// Users & Team Management
			usersGroup := protected.Group("/users")
			{
				usersGroup.GET("", middleware.RequireRoles(rbac.RoleAdmin, rbac.RoleManager), userHdlr.List)
				usersGroup.POST("", middleware.RequireRoles(rbac.RoleAdmin), userHdlr.Create)
				usersGroup.GET("/:id", middleware.RequireRoles(rbac.RoleAdmin, rbac.RoleManager), userHdlr.Get)
				usersGroup.PUT("/:id", middleware.RequireRoles(rbac.RoleAdmin), userHdlr.Update)
			}

			// CRM Module (Phase 2)
			clientHdlr.RegisterRoutes(protected)
			leadHdlr.RegisterRoutes(protected)
			visitHdlr.RegisterRoutes(protected)
			timelineHdlr.RegisterRoutes(protected)

			// Placeholder dashboard endpoint for Phase 1
			protected.GET("/dashboard", func(c *gin.Context) {
				companyID, _ := common.GetCompanyID(c)
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Dashboard CRM BTP socle Phase 1",
					"data": gin.H{
						"company_id": companyID,
						"stats": gin.H{
							"active_projects": 0,
							"pending_quotes":  0,
							"total_clients":   0,
							"currency":        "DZD",
						},
					},
				})
			})
		}
	}

	log.Printf("CRM BTP API starting on port %s (%s mode)\n", cfg.Port, cfg.AppEnv)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
