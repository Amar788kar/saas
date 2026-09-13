package rbac

const (
	RoleAdmin      = "ADMIN"
	RoleManager    = "MANAGER"
	RoleCommercial = "COMMERCIAL"
	RoleEmployee   = "EMPLOYEE"
)

// ValidRoles returns map of allowed system roles.
var ValidRoles = map[string]int{
	RoleAdmin:      1,
	RoleManager:    2,
	RoleCommercial: 3,
	RoleEmployee:   4,
}

func IsValidRole(roleCode string) bool {
	_, exists := ValidRoles[roleCode]
	return exists
}

// HasRole checks if candidateRole is in one of allowedRoles.
func HasRole(candidateRole string, allowedRoles []string) bool {
	if candidateRole == RoleAdmin {
		return true // ADMIN has super-privilege access across all endpoints
	}
	for _, r := range allowedRoles {
		if r == candidateRole {
			return true
		}
	}
	return false
}
