package hash

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

var (
	ErrInvalidHash         = errors.New("the encoded hash is not in the correct format")
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
)

type Params struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

var DefaultParams = &Params{
	Memory:      64 * 1024, // 64 MB
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

// GenerateFromPassword hashes a plain password using Argon2id with default parameters.
func GenerateFromPassword(password string) (string, error) {
	return GenerateFromPasswordWithParams(password, DefaultParams)
}

// GenerateFromPasswordWithParams hashes a password with specific Argon2id parameters.
func GenerateFromPasswordWithParams(password string, p *Params) (string, error) {
	salt := make([]byte, p.SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, p.Iterations, p.Memory, p.Parallelism, p.KeyLength)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	encoded := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, p.Memory, p.Iterations, p.Parallelism, b64Salt, b64Hash)

	return encoded, nil
}

// ComparePasswordAndHash verifies if a plain password matches an Argon2id encoded hash.
func ComparePasswordAndHash(password, encodedHash string) (bool, error) {
	p, salt, hash, err := decodeHash(encodedHash)
	if err != nil {
		return false, err
	}

	otherHash := argon2.IDKey([]byte(password), salt, p.Iterations, p.Memory, p.Parallelism, p.KeyLength)

	if subtle.ConstantTimeCompare(hash, otherHash) == 1 {
		return true, nil
	}

	return false, nil
}

func decodeHash(encodedHash string) (*Params, []byte, []byte, error) {
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return nil, nil, nil, ErrInvalidHash
	}

	if vals[1] != "argon2id" {
		return nil, nil, nil, ErrInvalidHash
	}

	var version int
	_, err := fmt.Sscanf(vals[2], "v=%d", &version)
	if err != nil {
		return nil, nil, nil, err
	}
	if version != argon2.Version {
		return nil, nil, nil, ErrIncompatibleVersion
	}

	p := &Params{}
	_, err = fmt.Sscanf(vals[3], "m=%d,t=%d,p=%d", &p.Memory, &p.Iterations, &p.Parallelism)
	if err != nil {
		return nil, nil, nil, err
	}

	salt, err := base64.RawStdEncoding.Strict().DecodeString(vals[4])
	if err != nil {
		return nil, nil, nil, err
	}
	p.SaltLength = uint32(len(salt))

	hash, err := base64.RawStdEncoding.Strict().DecodeString(vals[5])
	if err != nil {
		return nil, nil, nil, err
	}
	p.KeyLength = uint32(len(hash))

	return p, salt, hash, nil
}
