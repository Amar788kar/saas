package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"crm-btp/internal/common"
	"crm-btp/internal/middleware"
	"crm-btp/pkg/token"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func setupTestRouter(tm *token.TokenManager) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Protected tenant endpoint
	v1 := r.Group("/api/v1")
	v1.Use(middleware.Auth(tm))
	v1.Use(middleware.TenantContext())
	{
		v1.GET("/data", func(c *gin.Context) {
			companyID, _ := common.GetCompanyID(c)
			c.JSON(http.StatusOK, gin.H{
				"company_id": companyID.String(),
				"data":       "confidential tenant data",
			})
		})

		v1.GET("/admin-only", middleware.RequireRoles("ADMIN"), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "admin_granted"})
		})
	}

	return r
}

func TestTenantIsolationAndRBAC(t *testing.T) {
	tm := token.NewTokenManager("secret-key-32-chars-minimum-token-manager-2026", "crm-btp-test", 15*time.Minute, 24*time.Hour)
	r := setupTestRouter(tm)

	companyA := uuid.New()
	userA := uuid.New()
	companyB := uuid.New()
	userB := uuid.New()

	// 1. Generate token for Admin of Company A
	tokenAdminA, _, _ := tm.GenerateAccessToken(userA, companyA, "ADMIN", "admin@companya.dz")

	// 2. Generate token for Employee of Company B
	tokenEmployeeB, _, _ := tm.GenerateAccessToken(userB, companyB, "EMPLOYEE", "worker@companyb.dz")

	// Test A: Admin A requests data with their valid token -> 200 OK & returns companyA
	reqA := httptest.NewRequest(http.MethodGet, "/api/v1/data", nil)
	reqA.Header.Set("Authorization", "Bearer "+tokenAdminA)
	wA := httptest.NewRecorder()
	r.ServeHTTP(wA, reqA)

	if wA.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for Admin A, got %d", wA.Code)
	}

	// Test B: Cross-tenant attack -> Employee B presents their token but sets X-Company-ID header to Company A -> 403 Forbidden!
	reqSpoof := httptest.NewRequest(http.MethodGet, "/api/v1/data", nil)
	reqSpoof.Header.Set("Authorization", "Bearer "+tokenEmployeeB)
	reqSpoof.Header.Set("X-Company-ID", companyA.String())
	wSpoof := httptest.NewRecorder()
	r.ServeHTTP(wSpoof, reqSpoof)

	if wSpoof.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden on tenant spoofing attempt, got %d", wSpoof.Code)
	}

	// Test C: RBAC Check -> Employee B tries to access admin-only endpoint -> 403 Forbidden!
	reqAdminOnly := httptest.NewRequest(http.MethodGet, "/api/v1/admin-only", nil)
	reqAdminOnly.Header.Set("Authorization", "Bearer "+tokenEmployeeB)
	wAdminOnly := httptest.NewRecorder()
	r.ServeHTTP(wAdminOnly, reqAdminOnly)

	if wAdminOnly.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for employee on admin endpoint, got %d", wAdminOnly.Code)
	}

	// Test D: Admin A accesses admin-only endpoint -> 200 OK
	reqAdminGrant := httptest.NewRequest(http.MethodGet, "/api/v1/admin-only", nil)
	reqAdminGrant.Header.Set("Authorization", "Bearer "+tokenAdminA)
	wAdminGrant := httptest.NewRecorder()
	r.ServeHTTP(wAdminGrant, reqAdminGrant)

	if wAdminGrant.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for admin on admin endpoint, got %d", wAdminGrant.Code)
	}
}
