package tests

import (
	"testing"

	"crm-btp/pkg/hash"
)

func TestArgon2PasswordHashing(t *testing.T) {
	password := "SecretPass123!"

	hashed, err := hash.GenerateFromPassword(password)
	if err != nil {
		t.Fatalf("expected no error generating hash, got %v", err)
	}

	if len(hashed) == 0 {
		t.Fatal("expected non-empty hash string")
	}

	// Verify correct password matches
	matched, err := hash.ComparePasswordAndHash(password, hashed)
	if err != nil {
		t.Fatalf("expected no error comparing password, got %v", err)
	}
	if !matched {
		t.Fatal("expected password to match hash")
	}

	// Verify wrong password does NOT match
	wrongMatched, err := hash.ComparePasswordAndHash("WrongPassword!", hashed)
	if err != nil {
		t.Fatalf("expected no error comparing wrong password, got %v", err)
	}
	if wrongMatched {
		t.Fatal("expected wrong password to NOT match hash")
	}
}
