package user

import (
	"strconv"

	"crm-btp/internal/common"
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	users, total, err := h.service.ListUsers(c.Request.Context(), companyID, page, limit)
	if err != nil {
		response.InternalServerError(c, "Impossible de récupérer les utilisateurs: "+err.Error())
		return
	}

	response.Paginated(c, users, total, page, limit)
}

func (h *Handler) Get(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "INVALID_ID", "Identifiant utilisateur invalide", nil)
		return
	}

	u, err := h.service.GetUser(c.Request.Context(), companyID, targetID)
	if err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "Utilisateur introuvable")
		return
	}

	response.OK(c, "Utilisateur récupéré", u)
}

func (h *Handler) Create(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	currentUserID, err := common.GetUserID(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_REQUIRED", "User context missing")
		return
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Champs invalides", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	newUser, err := h.service.CreateUser(c.Request.Context(), companyID, currentUserID, req, ip, ua)
	if err != nil {
		response.BadRequest(c, "CREATION_FAILED", err.Error(), nil)
		return
	}

	response.Created(c, "Collaborateur créé avec succès", newUser)
}

func (h *Handler) Update(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	currentUserID, err := common.GetUserID(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_REQUIRED", "User context missing")
		return
	}

	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "INVALID_ID", "Identifiant utilisateur invalide", nil)
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Champs invalides", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	updatedUser, err := h.service.UpdateUser(c.Request.Context(), companyID, currentUserID, targetID, req, ip, ua)
	if err != nil {
		response.BadRequest(c, "UPDATE_FAILED", err.Error(), nil)
		return
	}

	response.OK(c, "Collaborateur mis à jour avec succès", updatedUser)
}
