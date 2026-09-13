package auth

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

// Register registers a new company and its initial Admin account.
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Données d'inscription incomplètes ou invalides", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	authResp, err := h.service.Register(c.Request.Context(), req, ip, ua)
	if err != nil {
		response.BadRequest(c, "REGISTRATION_FAILED", err.Error(), nil)
		return
	}

	response.Created(c, "Entreprise et compte créés avec succès", authResp)
}

// Login handles user login and issues access & refresh tokens.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Email et mot de passe requis", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	authResp, err := h.service.Login(c.Request.Context(), req, ip, ua)
	if err != nil {
		response.Unauthorized(c, "INVALID_CREDENTIALS", err.Error())
		return
	}

	response.OK(c, "Connexion réussie", authResp)
}

// Refresh handles token rotation using refresh token.
func (h *Handler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Refresh token requis", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	authResp, err := h.service.Refresh(c.Request.Context(), req.RefreshToken, ip, ua)
	if err != nil {
		response.Unauthorized(c, "TOKEN_EXPIRED", err.Error())
		return
	}

	response.OK(c, "Token actualisé avec succès", authResp)
}

// Logout revokes the given refresh token.
func (h *Handler) Logout(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Refresh token requis pour la déconnexion", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	_ = h.service.Logout(c.Request.Context(), req.RefreshToken, ip, ua)
	response.OK(c, "Déconnexion réussie", nil)
}

// Me returns the profile of the current authenticated user and their company.
func (h *Handler) Me(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	userID, err := common.GetUserID(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_REQUIRED", "User context missing")
		return
	}

	u, comp, err := h.service.GetMe(c.Request.Context(), companyID, userID)
	if err != nil {
		response.NotFound(c, "USER_NOT_FOUND", "Utilisateur introuvable")
		return
	}

	response.OK(c, "Profil récupéré", gin.H{
		"user":    u,
		"company": comp,
	})
}

// ChangePassword updates password for current authenticated user.
func (h *Handler) ChangePassword(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		response.Unauthorized(c, "TENANT_REQUIRED", "Tenant context missing")
		return
	}

	userID, err := common.GetUserID(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_REQUIRED", "User context missing")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_FAILED", "Champs de mot de passe invalides", err.Error())
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.service.ChangePassword(c.Request.Context(), companyID, userID, req, ip, ua); err != nil {
		response.BadRequest(c, "PASSWORD_CHANGE_FAILED", err.Error(), nil)
		return
	}

	response.OK(c, "Mot de passe modifié avec succès", nil)
}
