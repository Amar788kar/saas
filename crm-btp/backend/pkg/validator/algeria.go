package validator

import (
	"regexp"
	"strings"
	"unicode"
)

var (
	dzPhoneRegex = regexp.MustCompile(`^(?:\+213|00213|0)(?:[567][0-9]{8}|[234][0-9]{7})$`)
	emailRegex   = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
)

// IsValidAlgerianPhone checks if the given phone string matches Algerian mobile or fixed numbers.
func IsValidAlgerianPhone(phone string) bool {
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, ".", "")
	return dzPhoneRegex.MatchString(cleaned)
}

// IsValidEmail checks standard email syntax.
func IsValidEmail(email string) bool {
	return emailRegex.MatchString(strings.TrimSpace(email))
}

// IsStrongPassword requires at least 8 characters, with at least 1 digit, 1 upper and 1 lower character.
func IsStrongPassword(password string) (bool, string) {
	if len(password) < 8 {
		return false, "Le mot de passe doit comporter au moins 8 caractères."
	}
	var hasUpper, hasLower, hasNumber bool
	for _, c := range password {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsNumber(c):
			hasNumber = true
		}
	}
	if !hasUpper {
		return false, "Le mot de passe doit contenir au moins une lettre majuscule."
	}
	if !hasLower {
		return false, "Le mot de passe doit contenir au moins une lettre minuscule."
	}
	if !hasNumber {
		return false, "Le mot de passe doit contenir au moins un chiffre."
	}
	return true, ""
}

// Wilayas d'Algérie (58 wilayas)
var AlgerianWilayas = map[string]bool{
	"Adrar": true, "Chlef": true, "Laghouat": true, "Oum El Bouaghi": true, "Batna": true,
	"Béjaïa": true, "Biskra": true, "Béchar": true, "Blida": true, "Bouira": true,
	"Tamanrasset": true, "Tébessa": true, "Tlemcen": true, "Tiaret": true, "Tizi Ouzou": true,
	"Alger": true, "Djelfa": true, "Jijel": true, "Sétif": true, "Saïda": true,
	"Skikda": true, "Sidi Bel Abbès": true, "Annaba": true, "Guelma": true, "Constantine": true,
	"Médéa": true, "Mostaganem": true, "M'Sila": true, "Mascara": true, "Ouargla": true,
	"Oran": true, "El Bayadh": true, "Illizi": true, "Bordj Bou Arreridj": true, "Boumerdès": true,
	"El Tarf": true, "Tindouf": true, "Tissemsilt": true, "El Oued": true, "Khenchela": true,
	"Souk Ahras": true, "Tipaza": true, "Mila": true, "Aïn Defla": true, "Naâma": true,
	"Aïn Témouchent": true, "Ghardaïa": true, "Relizane": true, "Timimoun": true, "Bordj Badji Mokhtar": true,
	"Ouled Djellal": true, "Béni Abbès": true, "In Salah": true, "In Guezzam": true, "Touggourt": true,
	"Djanet": true, "El M'Ghair": true, "El Meniaa": true,
}

func IsValidWilaya(wilaya string) bool {
	if wilaya == "" {
		return false
	}
	_, ok := AlgerianWilayas[strings.TrimSpace(wilaya)]
	return ok
}
