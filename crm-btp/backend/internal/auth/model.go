package auth

import (
	"time"

	"crm-btp/internal/company"
	"crm-btp/internal/user"
	"github.com/google/uuid"
)

type RegisterRequest struct {
	// Informations Société
	CompanyName string  `json:"company_name" binding:"required"`
	TradeName   *string `json:"trade_name"`
	LegalForm   string  `json:"legal_form"` // SARL, EURL, Artisan...
	Wilaya      string  `json:"wilaya" binding:"required"`
	CompanyPhone string `json:"company_phone" binding:"required"`
	CompanyEmail string `json:"company_email" binding:"required,email"`

	// Compte Gérant (Admin)
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type AuthResponse struct {
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
	ExpiresAt    time.Time        `json:"expires_at"`
	User         *user.User       `json:"user"`
	Company      *company.Company `json:"company"`
}

type RefreshTokenSession struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	CompanyID uuid.UUID  `json:"company_id"`
	TokenHash string     `json:"token_hash"`
	IPAddress string     `json:"ip_address"`
	UserAgent string     `json:"user_agent"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}
