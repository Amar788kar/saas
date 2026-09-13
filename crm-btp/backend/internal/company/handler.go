package company

import (
	"crm-btp/internal/common"
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// GetProfile returns the current tenant company profile.
func (h *Handler) GetProfile(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context is missing")
		return
	}

	comp, err := h.service.GetCompany(c.Request.Context(), companyID)
	if err != nil {
		response.NotFound(c, "COMPANY_NOT_FOUND", "Informations de l'entreprise introuvables")
		return
	}

	response.OK(c, "Entreprise récupérée avec succès", comp)
}

// UpdateProfile updates the current tenant company profile.
func (h *Handler) UpdateProfile(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context is missing")
		return
	}

	userID, err := common.GetUserID(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_REQUIRED", "User context is missing")
		return
	}

	var req UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Champs de formulaire invalides", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	updated, err := h.service.UpdateCompany(c.Request.Context(), companyID, userID, req, ip, ua)
	if err != nil {
		response.BadRequest(c, "UPDATE_FAILED", err.Error(), nil)
		return
	}

	response.OK(c, "Entreprise mise à jour avec succès", updated)
}
