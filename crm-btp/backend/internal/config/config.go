package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv         string
	Port           string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	JWTIssuer      string
	AccessExpiry   time.Duration
	RefreshExpiry  time.Duration
	AllowedOrigins []string
}

func Load() *Config {
	// Attempt to load .env
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	cfg := &Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/crm_btp?sslmode=disable"),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:     getEnv("JWT_SECRET", "super-secret-jwt-key-minimum-32-chars-btp-crm-2026!"),
		JWTIssuer:     getEnv("JWT_ISSUER", "crm-btp-api"),
		AccessExpiry:  time.Duration(getEnvAsInt("JWT_ACCESS_EXPIRY_MINUTES", 15)) * time.Minute,
		RefreshExpiry: time.Duration(getEnvAsInt("JWT_REFRESH_EXPIRY_DAYS", 7)) * 24 * time.Hour,
	}

	if len(cfg.JWTSecret) < 32 {
		log.Println("WARNING: JWT_SECRET should be at least 32 characters long for production!")
	}

	return cfg
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	if val, ok := os.LookupEnv(key); ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}
