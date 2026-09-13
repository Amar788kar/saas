package middleware

import (
	"crm-btp/internal/common"
	"crm-btp/internal/rbac"
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
)

// RequireRoles restricts access to users having one of the specified roles (or ADMIN).
func RequireRoles(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleCode, err := common.GetRoleCode(c)
		if err != nil {
			response.Unauthorized(c, "AUTH_REQUIRED", "Authentification requise")
			c.Abort()
			return
		}

		if !rbac.HasRole(roleCode, roles) {
			response.Forbidden(c, "PERMISSION_DENIED", "Vous n'avez pas les droits nécessaires pour effectuer cette action")
			c.Abort()
			return
		}

		c.Next()
	}
}
