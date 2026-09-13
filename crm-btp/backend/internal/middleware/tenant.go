package middleware

import (
	"crm-btp/internal/common"
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TenantContext ensures that the request has an authenticated company_id.
// It also checks the optional X-Company-ID header to prevent cross-tenant spoofing.
func TenantContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID, err := common.GetCompanyID(c)
		if err != nil || companyID == uuid.Nil {
			response.Unauthorized(c, "TENANT_REQUIRED", "Contexte d'entreprise introuvable")
			c.Abort()
			return
		}

		// Cross-tenant verification: if client provided X-Company-ID, it MUST match token claims
		headerCompany := c.GetHeader("X-Company-ID")
		if headerCompany != "" {
			reqID, err := uuid.Parse(headerCompany)
			if err != nil || reqID != companyID {
				response.Forbidden(c, "TENANT_MISMATCH", "Tentative d'accès non autorisée à un autre tenant")
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
