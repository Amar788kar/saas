package timeline

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"crm-btp/internal/common"
)

// Handler handles HTTP requests for timeline
type Handler struct {
	service TimelineService
}

// NewHandler creates a new timeline handler
func NewHandler(service TimelineService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the timeline routes
func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	timeline := router.Group("/timeline")
	{
		timeline.POST("", h.CreateEvent)
		timeline.GET("/client/:client_id", h.ListEventsByClient)
		timeline.GET("/lead/:lead_id", h.ListEventsByLead)
	}
}

// CreateEvent godoc
func (h *Handler) CreateEvent(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-assign created_by from context if missing
	if req.CreatedBy == nil {
		userID, err := common.GetUserID(c)
		if err == nil {
			req.CreatedBy = &userID
		}
	}

	event, err := h.service.CreateEvent(c.Request.Context(), companyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create timeline event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Event created successfully",
		"data":    event,
	})
}

// ListEventsByClient godoc
func (h *Handler) ListEventsByClient(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	clientID, err := uuid.Parse(c.Param("client_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID format"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	events, err := h.service.ListEventsByClient(c.Request.Context(), companyID, clientID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list timeline events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": events,
	})
}

// ListEventsByLead godoc
func (h *Handler) ListEventsByLead(c *gin.Context) {
	companyID, err := common.GetCompanyID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: company context missing"})
		return
	}

	leadID, err := uuid.Parse(c.Param("lead_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID format"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	events, err := h.service.ListEventsByLead(c.Request.Context(), companyID, leadID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list timeline events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": events,
	})
}
