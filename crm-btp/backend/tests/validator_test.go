package tests

import (
	"testing"

	"crm-btp/pkg/validator"
)

func TestAlgerianPhoneValidation(t *testing.T) {
	validPhones := []string{
		"0550123456",
		"0661987654",
		"0770112233",
		"+213550123456",
		"021123456",
		"05 50 12 34 56",
		"06-61-98-76-54",
	}

	for _, phone := range validPhones {
		if !validator.IsValidAlgerianPhone(phone) {
			t.Errorf("expected phone '%s' to be valid", phone)
		}
	}

	invalidPhones := []string{
		"0123456789",
		"123456",
		"0850123456",
		"abc05501234",
	}

	for _, phone := range invalidPhones {
		if validator.IsValidAlgerianPhone(phone) {
			t.Errorf("expected phone '%s' to be invalid", phone)
		}
	}
}

func TestWilayaValidation(t *testing.T) {
	if !validator.IsValidWilaya("Alger") {
		t.Error("expected 'Alger' to be valid wilaya")
	}
	if !validator.IsValidWilaya("Oran") {
		t.Error("expected 'Oran' to be valid wilaya")
	}
	if !validator.IsValidWilaya("Constantine") {
		t.Error("expected 'Constantine' to be valid wilaya")
	}
	if validator.IsValidWilaya("Paris") {
		t.Error("expected 'Paris' to NOT be valid Algerian wilaya")
	}
}

func TestPasswordStrength(t *testing.T) {
	ok, _ := validator.IsStrongPassword("BtpPro2026!")
	if !ok {
		t.Error("expected 'BtpPro2026!' to be strong password")
	}

	weak, _ := validator.IsStrongPassword("short")
	if weak {
		t.Error("expected 'short' to fail strong password check")
	}

	noUpper, _ := validator.IsStrongPassword("btppro2026!")
	if noUpper {
		t.Error("expected 'btppro2026!' to fail without uppercase")
	}
}
