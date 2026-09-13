package tests

import (
	"testing"
	"time"

	"crm-btp/pkg/token"
	"github.com/google/uuid"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	secret := "test-secret-at-least-32-bytes-long-key-for-jwt"
	issuer := "crm-btp-test"
	accessExpiry := 5 * time.Minute
	refreshExpiry := 24 * time.Hour

	tm := token.NewTokenManager(secret, issuer, accessExpiry, refreshExpiry)

	userID := uuid.New()
	companyID := uuid.New()
	roleCode := "ADMIN"
	email := "gerant@alger-renov.dz"

	// 1. Generate access token
	accessToken, expiresAt, err := tm.GenerateAccessToken(userID, companyID, roleCode, email)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(accessToken) == 0 {
		t.Fatal("expected non-empty access token")
	}

	if time.Now().After(expiresAt) {
		t.Fatal("expiresAt should be in the future")
	}

	// 2. Validate token
	claims, err := tm.ValidateAccessToken(accessToken)
	if err != nil {
		t.Fatalf("failed to validate valid token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %v, got %v", userID, claims.UserID)
	}
	if claims.CompanyID != companyID {
		t.Errorf("expected CompanyID %v, got %v", companyID, claims.CompanyID)
	}
	if claims.RoleCode != roleCode {
		t.Errorf("expected RoleCode %s, got %s", roleCode, claims.RoleCode)
	}
	if claims.Email != email {
		t.Errorf("expected Email %s, got %s", email, claims.Email)
	}

	// 3. Test invalid token
	_, err = tm.ValidateAccessToken("invalid.fake.jwt.token")
	if err == nil {
		t.Fatal("expected error for forged token, got nil")
	}

	// 4. Test Refresh Token generation
	rawRefresh, hashRefresh, refreshExp, err := tm.GenerateRefreshToken()
	if err != nil {
		t.Fatalf("expected no error generating refresh token, got %v", err)
	}
	if len(rawRefresh) != 64 { // 32 bytes hex encoded
		t.Errorf("expected 64 chars hex token, got length %d", len(rawRefresh))
	}
	if len(hashRefresh) != 64 { // sha256 hex
		t.Errorf("expected 64 chars sha256 hash, got length %d", len(hashRefresh))
	}
	if time.Now().After(refreshExp) {
		t.Fatal("refresh expiration must be in future")
	}
}
