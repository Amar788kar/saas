package visits

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"crm-btp/internal/common"
)

// Handler handles HTTP requests for visits
type Handler struct {
	service VisitService
}

// NewHandler creates a new visit handler
func NewHandler(service VisitService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the visit routes
func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	visits := router.Group("/visits")
	{
		visits.POST("", h.CreateVisit)
		visits.GET("", h.ListVisits)
		visits.GET("/:id", h.GetVisit)
		visits.PUT("/:id", h.UpdateVisit)
		visits.DELETE("/:id", h.DeleteVisit)
	}
}

// CreateVisit godoc
func (h *Handler) CreateVisit(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	var req CreateVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	visit, err := h.service.CreateVisit(c.Request.Context(), companyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create visit"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Visit created successfully",
		"data":    visit,
	})
}

// ListVisits godoc
func (h *Handler) ListVisits(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	visits, err := h.service.ListVisits(c.Request.Context(), companyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list visits"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": visits,
	})
}

// GetVisit godoc
func (h *Handler) GetVisit(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid visit ID format"})
		return
	}

	visit, err := h.service.GetVisit(c.Request.Context(), companyID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Visit not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": visit,
	})
}

// UpdateVisit godoc
func (h *Handler) UpdateVisit(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid visit ID format"})
		return
	}

	var req UpdateVisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	visit, err := h.service.UpdateVisit(c.Request.Context(), companyID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update visit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Visit updated successfully",
		"data":    visit,
	})
}

// DeleteVisit godoc
func (h *Handler) DeleteVisit(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid visit ID format"})
		return
	}

	if err := h.service.DeleteVisit(c.Request.Context(), companyID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete visit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Visit deleted successfully",
	})
}
