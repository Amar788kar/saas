package middleware

import (
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
)

// SecurityHeaders applies standard OWASP recommended security headers.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}

// RecoveryMiddleware gracefully handles unhandled panics and outputs clean JSON.
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				response.InternalServerError(c, "Une erreur inattendue est survenue sur le serveur")
				c.Abort()
			}
		}()
		c.Next()
	}
}
