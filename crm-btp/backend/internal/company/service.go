package company

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"crm-btp/internal/audit"
	"crm-btp/pkg/validator"
	"github.com/google/uuid"
)

type Service interface {
	GetCompany(ctx context.Context, id uuid.UUID) (*Company, error)
	UpdateCompany(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateCompanyRequest, ip, ua string) (*Company, error)
}

type service struct {
	repo         Repository
	auditService audit.Service
}

func NewService(repo Repository, auditService audit.Service) Service {
	return &service{
		repo:         repo,
		auditService: auditService,
	}
}

func (s *service) GetCompany(ctx context.Context, id uuid.UUID) (*Company, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) UpdateCompany(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateCompanyRequest, ip, ua string) (*Company, error) {
	if !validator.IsValidWilaya(req.Wilaya) {
		return nil, fmt.Errorf("wilaya invalide: %s", req.Wilaya)
	}

	if !validator.IsValidAlgerianPhone(req.Phone) {
		return nil, errors.New("numéro de téléphone algérien invalide (ex: 0550123456)")
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	oldValues, _ := json.Marshal(existing)

	existing.Name = req.Name
	existing.TradeName = req.TradeName
	existing.LegalForm = req.LegalForm
	existing.NIF = req.NIF
	existing.NIS = req.NIS
	existing.RC = req.RC
	existing.ArticleTaxe = req.ArticleTaxe
	existing.Phone = req.Phone
	existing.Email = req.Email
	existing.Address = req.Address
	existing.Wilaya = req.Wilaya
	existing.Commune = req.Commune

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	newValues, _ := json.Marshal(existing)

	// Record audit
	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  id,
		UserID:     &userID,
		Action:     "UPDATE",
		EntityName: "COMPANY",
		EntityID:   id.String(),
		OldValues:  oldValues,
		NewValues:  newValues,
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return existing, nil
}
