package middleware

import (
	"fmt"
	"net/http"
	"time"

	"crm-btp/internal/database"
	"crm-btp/pkg/response"
	"github.com/gin-gonic/gin"
)

// RateLimiter limits requests per client IP to prevent brute-force attacks.
func RateLimiter(cache database.Cache, maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := fmt.Sprintf("rl:%s:%s", c.FullPath(), ip)

		count, err := cache.Incr(c.Request.Context(), key)
		if err != nil {
			// Fail open if cache error
			c.Next()
			return
		}

		if count == 1 {
			_ = cache.Expire(c.Request.Context(), key, window)
		}

		if count > int64(maxRequests) {
			response.Error(c, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", "Trop de requêtes, veuillez réessayer plus tard", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
