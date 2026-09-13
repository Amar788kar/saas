package leads

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"crm-btp/internal/common"
)

// Handler handles HTTP requests for leads
type Handler struct {
	service LeadService
}

// NewHandler creates a new lead handler
func NewHandler(service LeadService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the lead routes
func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	leads := router.Group("/leads")
	{
		leads.POST("", h.CreateLead)
		leads.GET("", h.ListLeads)
		leads.GET("/:id", h.GetLead)
		leads.PUT("/:id", h.UpdateLead)
		leads.PUT("/:id/status", h.UpdateLeadStatus)
		leads.DELETE("/:id", h.DeleteLead)
	}
}

// CreateLead godoc
func (h *Handler) CreateLead(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	var req CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lead, err := h.service.CreateLead(c.Request.Context(), companyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lead"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lead created successfully",
		"data":    lead,
	})
}

// ListLeads godoc
func (h *Handler) ListLeads(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	leads, err := h.service.ListLeads(c.Request.Context(), companyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list leads"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": leads,
	})
}

// GetLead godoc
func (h *Handler) GetLead(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID format"})
		return
	}

	lead, err := h.service.GetLead(c.Request.Context(), companyID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": lead,
	})
}

// UpdateLead godoc
func (h *Handler) UpdateLead(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID format"})
		return
	}

	var req UpdateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lead, err := h.service.UpdateLead(c.Request.Context(), companyID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lead"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead updated successfully",
		"data":    lead,
	})
}

// UpdateLeadStatus godoc
func (h *Handler) UpdateLeadStatus(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID format"})
		return
	}

	var req UpdateLeadStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateLeadStatus(c.Request.Context(), companyID, id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lead status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead status updated successfully",
	})
}

// DeleteLead godoc
func (h *Handler) DeleteLead(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID format"})
		return
	}

	if err := h.service.DeleteLead(c.Request.Context(), companyID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete lead"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead deleted successfully",
	})
}
