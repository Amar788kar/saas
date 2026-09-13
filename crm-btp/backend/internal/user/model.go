package user

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	CompanyID    uuid.UUID  `json:"company_id"`
	RoleID       int        `json:"role_id"`
	RoleCode     string     `json:"role_code"`
	RoleName     string     `json:"role_name"`
	FirstName    string     `json:"first_name"`
	LastName     string     `json:"last_name"`
	Email        string     `json:"email"`
	Phone        *string    `json:"phone,omitempty"`
	JobTitle     *string    `json:"job_title,omitempty"`
	PasswordHash string     `json:"-"`
	Status       string     `json:"status"`
	AvatarURL    *string    `json:"avatar_url,omitempty"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateUserRequest struct {
	FirstName string  `json:"first_name" binding:"required"`
	LastName  string  `json:"last_name" binding:"required"`
	Email     string  `json:"email" binding:"required,email"`
	Phone     *string `json:"phone"`
	JobTitle  *string `json:"job_title"`
	RoleCode  string  `json:"role_code" binding:"required"`
	Password  string  `json:"password" binding:"required,min=8"`
}

type UpdateUserRequest struct {
	FirstName string  `json:"first_name" binding:"required"`
	LastName  string  `json:"last_name" binding:"required"`
	Phone     *string `json:"phone"`
	JobTitle  *string `json:"job_title"`
	RoleCode  string  `json:"role_code" binding:"required"`
	Status    string  `json:"status" binding:"required"`
}
