package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	CompanyID uuid.UUID `json:"company_id"`
	RoleCode  string    `json:"role_code"`
	Email     string    `json:"email"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	secretKey     []byte
	issuer        string
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewTokenManager(secret string, issuer string, accessExpiry, refreshExpiry time.Duration) *TokenManager {
	return &TokenManager{
		secretKey:     []byte(secret),
		issuer:        issuer,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// GenerateAccessToken signs a new JWT access token with user and company claims.
func (tm *TokenManager) GenerateAccessToken(userID, companyID uuid.UUID, roleCode, email string) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(tm.accessExpiry)

	claims := Claims{
		UserID:    userID,
		CompanyID: companyID,
		RoleCode:  roleCode,
		Email:     email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    tm.issuer,
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(tm.secretKey)
	if err != nil {
		return "", time.Time{}, err
	}

	return signed, expiresAt, nil
}

// ValidateAccessToken verifies the JWT signature and extracts the claims.
func (tm *TokenManager) ValidateAccessToken(tokenStr string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return tm.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GenerateRefreshToken creates a cryptographically strong random token string and its SHA256 hash.
func (tm *TokenManager) GenerateRefreshToken() (rawToken string, tokenHash string, expiresAt time.Time, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", time.Time{}, err
	}

	rawToken = hex.EncodeToString(bytes)
	tokenHash = HashRefreshToken(rawToken)
	expiresAt = time.Now().UTC().Add(tm.refreshExpiry)
	return rawToken, tokenHash, expiresAt, nil
}

// HashRefreshToken calculates the SHA-256 hash of a raw refresh token.
func HashRefreshToken(rawToken string) string {
	sum := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(sum[:])
}
