package clients

import (
	"context"

	"github.com/google/uuid"
)

// ClientService defines the interface for client operations
type ClientService interface {
	CreateClient(ctx context.Context, companyID uuid.UUID, req CreateClientRequest) (*Client, error)
	GetClient(ctx context.Context, companyID, id uuid.UUID) (*Client, error)
	UpdateClient(ctx context.Context, companyID, id uuid.UUID, req UpdateClientRequest) (*Client, error)
	DeleteClient(ctx context.Context, companyID, id uuid.UUID) error
	ListClients(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Client, error)
}

type clientService struct {
	repo ClientRepository
}

// NewClientService creates a new client service
func NewClientService(repo ClientRepository) ClientService {
	return &clientService{repo: repo}
}

// CreateClientRequest represents the data to create a client
type CreateClientRequest struct {
	Type    string `json:"type" binding:"required,oneof=INDIVIDUAL COMPANY"`
	Name    string `json:"name" binding:"required,max=255"`
	Phone   string `json:"phone" binding:"omitempty,max=50"`
	Email   string `json:"email" binding:"omitempty,email,max=255"`
	Address string `json:"address" binding:"omitempty"`
	Wilaya  string `json:"wilaya" binding:"omitempty,max=100"`
	Commune string `json:"commune" binding:"omitempty,max=100"`
	Notes   string `json:"notes" binding:"omitempty"`
	Source  string `json:"source" binding:"omitempty,max=100"`
}

// UpdateClientRequest represents the data to update a client
type UpdateClientRequest struct {
	Type    string `json:"type" binding:"required,oneof=INDIVIDUAL COMPANY"`
	Name    string `json:"name" binding:"required,max=255"`
	Phone   string `json:"phone" binding:"omitempty,max=50"`
	Email   string `json:"email" binding:"omitempty,email,max=255"`
	Address string `json:"address" binding:"omitempty"`
	Wilaya  string `json:"wilaya" binding:"omitempty,max=100"`
	Commune string `json:"commune" binding:"omitempty,max=100"`
	Notes   string `json:"notes" binding:"omitempty"`
	Source  string `json:"source" binding:"omitempty,max=100"`
	Status  string `json:"status" binding:"required,oneof=ACTIVE INACTIVE"`
}

func (s *clientService) CreateClient(ctx context.Context, companyID uuid.UUID, req CreateClientRequest) (*Client, error) {
	client := &Client{
		CompanyID: companyID,
		Type:      ClientType(req.Type),
		Name:      req.Name,
		Phone:     req.Phone,
		Email:     req.Email,
		Address:   req.Address,
		Wilaya:    req.Wilaya,
		Commune:   req.Commune,
		Notes:     req.Notes,
		Source:    req.Source,
		Status:    "ACTIVE",
	}

	if err := s.repo.Create(ctx, client); err != nil {
		return nil, err
	}
	return client, nil
}

func (s *clientService) GetClient(ctx context.Context, companyID, id uuid.UUID) (*Client, error) {
	return s.repo.GetByID(ctx, companyID, id)
}

func (s *clientService) UpdateClient(ctx context.Context, companyID, id uuid.UUID, req UpdateClientRequest) (*Client, error) {
	client, err := s.repo.GetByID(ctx, companyID, id)
	if err != nil {
		return nil, err
	}

	client.Type = ClientType(req.Type)
	client.Name = req.Name
	client.Phone = req.Phone
	client.Email = req.Email
	client.Address = req.Address
	client.Wilaya = req.Wilaya
	client.Commune = req.Commune
	client.Notes = req.Notes
	client.Source = req.Source
	client.Status = req.Status

	if err := s.repo.Update(ctx, client); err != nil {
		return nil, err
	}
	return client, nil
}

func (s *clientService) DeleteClient(ctx context.Context, companyID, id uuid.UUID) error {
	// Should check if it's referenced, but postgres constraints with CASCADE or SET NULL handle it
	return s.repo.Delete(ctx, companyID, id)
}

func (s *clientService) ListClients(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Client, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.List(ctx, companyID, limit, offset)
}
