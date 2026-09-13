package leads

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// LeadService defines the interface for lead operations
type LeadService interface {
	CreateLead(ctx context.Context, companyID uuid.UUID, req CreateLeadRequest) (*Lead, error)
	GetLead(ctx context.Context, companyID, id uuid.UUID) (*Lead, error)
	UpdateLead(ctx context.Context, companyID, id uuid.UUID, req UpdateLeadRequest) (*Lead, error)
	DeleteLead(ctx context.Context, companyID, id uuid.UUID) error
	ListLeads(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Lead, error)
	UpdateLeadStatus(ctx context.Context, companyID, id uuid.UUID, req UpdateLeadStatusRequest) error
}

type leadService struct {
	repo LeadRepository
}

// NewLeadService creates a new lead service
func NewLeadService(repo LeadRepository) LeadService {
	return &leadService{repo: repo}
}

// CreateLeadRequest represents the data to create a lead
type CreateLeadRequest struct {
	ClientID          *uuid.UUID `json:"client_id,omitempty"`
	Title             string     `json:"title" binding:"required,max=255"`
	EstimatedValue    *float64   `json:"estimated_value,omitempty"`
	ExpectedCloseDate *time.Time `json:"expected_close_date,omitempty"`
	AssignedTo        *uuid.UUID `json:"assigned_to,omitempty"`
}

// UpdateLeadRequest represents the data to update a lead
type UpdateLeadRequest struct {
	ClientID          *uuid.UUID `json:"client_id,omitempty"`
	Title             string     `json:"title" binding:"required,max=255"`
	EstimatedValue    *float64   `json:"estimated_value,omitempty"`
	ExpectedCloseDate *time.Time `json:"expected_close_date,omitempty"`
	AssignedTo        *uuid.UUID `json:"assigned_to,omitempty"`
}

// UpdateLeadStatusRequest represents the data to update a lead's status
type UpdateLeadStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (s *leadService) CreateLead(ctx context.Context, companyID uuid.UUID, req CreateLeadRequest) (*Lead, error) {
	lead := &Lead{
		CompanyID:         companyID,
		ClientID:          req.ClientID,
		Title:             req.Title,
		Status:            StatusNouveau,
		EstimatedValue:    req.EstimatedValue,
		ExpectedCloseDate: req.ExpectedCloseDate,
		AssignedTo:        req.AssignedTo,
	}

	if err := s.repo.Create(ctx, lead); err != nil {
		return nil, err
	}
	return lead, nil
}

func (s *leadService) GetLead(ctx context.Context, companyID, id uuid.UUID) (*Lead, error) {
	return s.repo.GetByID(ctx, companyID, id)
}

func (s *leadService) UpdateLead(ctx context.Context, companyID, id uuid.UUID, req UpdateLeadRequest) (*Lead, error) {
	lead, err := s.repo.GetByID(ctx, companyID, id)
	if err != nil {
		return nil, err
	}

	lead.ClientID = req.ClientID
	lead.Title = req.Title
	lead.EstimatedValue = req.EstimatedValue
	lead.ExpectedCloseDate = req.ExpectedCloseDate
	lead.AssignedTo = req.AssignedTo

	if err := s.repo.Update(ctx, lead); err != nil {
		return nil, err
	}
	return lead, nil
}

func (s *leadService) UpdateLeadStatus(ctx context.Context, companyID, id uuid.UUID, req UpdateLeadStatusRequest) error {
	status := LeadStatus(req.Status)
	// Optionally validate status against allowed values
	return s.repo.UpdateStatus(ctx, companyID, id, status)
}

func (s *leadService) DeleteLead(ctx context.Context, companyID, id uuid.UUID) error {
	return s.repo.Delete(ctx, companyID, id)
}

func (s *leadService) ListLeads(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Lead, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.List(ctx, companyID, limit, offset)
}
