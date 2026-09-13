package clients

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"crm-btp/internal/common"
)

// Handler handles HTTP requests for clients
type Handler struct {
	service ClientService
}

// NewHandler creates a new client handler
func NewHandler(service ClientService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the client routes
func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	clients := router.Group("/clients")
	{
		clients.POST("", h.CreateClient)
		clients.GET("", h.ListClients)
		clients.GET("/:id", h.GetClient)
		clients.PUT("/:id", h.UpdateClient)
		clients.DELETE("/:id", h.DeleteClient)
	}
}

// CreateClient godoc
func (h *Handler) CreateClient(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.service.CreateClient(c.Request.Context(), companyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Client created successfully",
		"data":    client,
	})
}

// ListClients godoc
func (h *Handler) ListClients(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	clients, err := h.service.ListClients(c.Request.Context(), companyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list clients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": clients,
	})
}

// GetClient godoc
func (h *Handler) GetClient(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID format"})
		return
	}

	client, err := h.service.GetClient(c.Request.Context(), companyID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": client,
	})
}

// UpdateClient godoc
func (h *Handler) UpdateClient(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID format"})
		return
	}

	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.service.UpdateClient(c.Request.Context(), companyID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update client"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Client updated successfully",
		"data":    client,
	})
}

// DeleteClient godoc
func (h *Handler) DeleteClient(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID format"})
		return
	}

	if err := h.service.DeleteClient(c.Request.Context(), companyID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete client"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Client deleted successfully",
	})
}
