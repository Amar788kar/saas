package middleware

import (
	"strings"

	"crm-btp/internal/common"
	"crm-btp/pkg/response"
	"crm-btp/pkg/token"
	"github.com/gin-gonic/gin"
)

func Auth(tokenManager *token.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "TOKEN_REQUIRED", "En-tête Authorization manquant")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && strings.EqualFold(parts[0], "Bearer")) {
			response.Unauthorized(c, "INVALID_TOKEN_FORMAT", "Format de token invalide (attendu: Bearer <token>)")
			c.Abort()
			return
		}

		claims, err := tokenManager.ValidateAccessToken(parts[1])
		if err != nil {
			response.Unauthorized(c, "TOKEN_INVALID", "Token d'accès expiré ou invalide")
			c.Abort()
			return
		}

		// Inject tenant and identity claims into Gin context
		c.Set(common.CtxUserIDKey, claims.UserID)
		c.Set(common.CtxCompanyIDKey, claims.CompanyID)
		c.Set(common.CtxRoleCodeKey, claims.RoleCode)
		c.Set(common.CtxEmailKey, claims.Email)

		c.Next()
	}
}
