package company

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Company struct {
	ID          uuid.UUID       `json:"id"`
	Name        string          `json:"name"`
	TradeName   *string         `json:"trade_name,omitempty"`
	LegalForm   string          `json:"legal_form"`
	NIF         *string         `json:"nif,omitempty"`
	NIS         *string         `json:"nis,omitempty"`
	RC          *string         `json:"rc,omitempty"`
	ArticleTaxe *string         `json:"article_taxe,omitempty"`
	Phone       string          `json:"phone"`
	Email       string          `json:"email"`
	Address     *string         `json:"address,omitempty"`
	Wilaya      string          `json:"wilaya"`
	Commune     *string         `json:"commune,omitempty"`
	Currency    string          `json:"currency"`
	Plan        string          `json:"plan"`
	Status      string          `json:"status"`
	Settings    json.RawMessage `json:"settings,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type UpdateCompanyRequest struct {
	Name        string  `json:"name" binding:"required"`
	TradeName   *string `json:"trade_name"`
	LegalForm   string  `json:"legal_form"`
	NIF         *string `json:"nif"`
	NIS         *string `json:"nis"`
	RC          *string `json:"rc"`
	ArticleTaxe *string `json:"article_taxe"`
	Phone       string  `json:"phone" binding:"required"`
	Email       string  `json:"email" binding:"required,email"`
	Address     *string `json:"address"`
	Wilaya      string  `json:"wilaya" binding:"required"`
	Commune     *string `json:"commune"`
}
