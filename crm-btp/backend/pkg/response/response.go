package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorDetail struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type ErrorResponse struct {
	Success bool        `json:"success"`
	Error   ErrorDetail `json:"error"`
}

type MetaPagination struct {
	Total       int64 `json:"total"`
	Page        int   `json:"page"`
	Limit       int   `json:"limit"`
	TotalPages  int   `json:"total_pages"`
	HasNextPage bool  `json:"has_next_page"`
}

type PaginatedResponse struct {
	Success bool           `json:"success"`
	Data    interface{}    `json:"data"`
	Meta    MetaPagination `json:"meta"`
}

func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Created(c *gin.Context, message string, data interface{}) {
	Success(c, http.StatusCreated, message, data)
}

func OK(c *gin.Context, message string, data interface{}) {
	Success(c, http.StatusOK, message, data)
}

func Error(c *gin.Context, statusCode int, code, message string, details interface{}) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func BadRequest(c *gin.Context, code, message string, details interface{}) {
	Error(c, http.StatusBadRequest, code, message, details)
}

func Unauthorized(c *gin.Context, code, message string) {
	Error(c, http.StatusUnauthorized, code, message, nil)
}

func Forbidden(c *gin.Context, code, message string) {
	Error(c, http.StatusForbidden, code, message, nil)
}

func NotFound(c *gin.Context, code, message string) {
	Error(c, http.StatusNotFound, code, message, nil)
}

func InternalServerError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, nil)
}

func Paginated(c *gin.Context, data interface{}, total int64, page, limit int) {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, PaginatedResponse{
		Success: true,
		Data:    data,
		Meta: MetaPagination{
			Total:       total,
			Page:        page,
			Limit:       limit,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
		},
	})
}
