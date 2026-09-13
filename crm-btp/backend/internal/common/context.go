package common

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	CtxCompanyIDKey = "company_id"
	CtxUserIDKey    = "user_id"
	CtxRoleCodeKey  = "role_code"
	CtxEmailKey     = "user_email"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrTenantMissed = errors.New("tenant company context missing")
)

// GetCompanyID extracts the tenant company UUID from the request context.
func GetCompanyID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get(CtxCompanyIDKey)
	if !exists {
		return uuid.Nil, ErrTenantMissed
	}
	id, ok := val.(uuid.UUID)
	if !ok {
		return uuid.Nil, ErrTenantMissed
	}
	return id, nil
}

// GetUserID extracts the authenticated user UUID from the request context.
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get(CtxUserIDKey)
	if !exists {
		return uuid.Nil, ErrUnauthorized
	}
	id, ok := val.(uuid.UUID)
	if !ok {
		return uuid.Nil, ErrUnauthorized
	}
	return id, nil
}

// GetRoleCode extracts the current user role code (ADMIN, MANAGER, etc.).
func GetRoleCode(c *gin.Context) (string, error) {
	val, exists := c.Get(CtxRoleCodeKey)
	if !exists {
		return "", ErrUnauthorized
	}
	role, ok := val.(string)
	if !ok {
		return "", ErrUnauthorized
	}
	return role, nil
}
