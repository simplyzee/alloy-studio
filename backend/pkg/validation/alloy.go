package validation

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/alloy-studio/backend/pkg/catalog"
)

type ValidationError struct {
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type ValidationResult struct {
	Valid           bool               `json:"valid"`
	Errors          []ValidationError  `json:"errors,omitempty"`
	Warnings        []ValidationError  `json:"warnings,omitempty"`
	FormattedConfig string             `json:"formatted_config,omitempty"`
}

func ValidateAlloyConfig(config, stabilityLevel string, enableCommunityComponents bool) (*ValidationResult, error) {
	result := &ValidationResult{
		Valid:    true,
		Errors:   []ValidationError{},
		Warnings: []ValidationError{},
	}

	// Try using alloy CLI if available
	alloyPath := getEnv("ALLOY_PATH", "alloy")
	if _, err := exec.LookPath(alloyPath); err == nil {
		// Write config to temporary file
		tmpDir := os.TempDir()
		tmpFile := filepath.Join(tmpDir, fmt.Sprintf("config-%d.alloy", os.Getpid()))

		if err := os.WriteFile(tmpFile, []byte(config), 0644); err != nil {
			return nil, fmt.Errorf("failed to write temp file: %w", err)
		}
		defer os.Remove(tmpFile)

		args := []string{"validate"}
		if stabilityLevel != "" {
			args = append(args, fmt.Sprintf("--stability.level=%s", stabilityLevel))
		}
		args = append(args, tmpFile)

		cmd := exec.Command(alloyPath, args...)
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		err := cmd.Run()
		result.Valid = err == nil

		if err != nil {
			errOutput := stderr.String()
			if errOutput != "" {
				result.Errors = append(result.Errors, ValidationError{
					Line:     0,
					Column:   0,
					Message:  errOutput,
					Severity: "error",
				})
			}
		}
		return result, nil
	}

	// Fallback: Basic syntax validation
	errors := performBasicValidation(config)
	result.Errors = errors
	result.Valid = len(errors) == 0

	return result, nil
}

func performBasicValidation(config string) []ValidationError {
	errors := []ValidationError{}
	lines := strings.Split(config, "\n")

	// Get all valid component names from catalog
	validComponents := getValidComponentNames()

	braceStack := []int{}
	quoteOpen := false

	for lineNum, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Skip comments and empty lines
		if trimmed == "" || strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Check for basic syntax patterns
		for i, char := range line {
			switch char {
			case '"':
				// Toggle quote state (simplified - doesn't handle escapes)
				if i == 0 || line[i-1] != '\\' {
					quoteOpen = !quoteOpen
				}
			case '{':
				if !quoteOpen {
					braceStack = append(braceStack, lineNum+1)
				}
			case '}':
				if !quoteOpen {
					if len(braceStack) == 0 {
						errors = append(errors, ValidationError{
							Line:     lineNum + 1,
							Column:   i + 1,
							Message:  "Unexpected closing brace '}'",
							Severity: "error",
						})
					} else {
						braceStack = braceStack[:len(braceStack)-1]
					}
				}
			}
		}

		// Check for component definition pattern
		// Pattern 1: word.word "label" { (valid component)
		// Pattern 2: word "label" { (likely invalid - missing category)
		parts := strings.Fields(trimmed)
		if len(parts) >= 2 && !strings.HasPrefix(trimmed, "//") {
			potentialComponent := parts[0]
			nextToken := parts[1]

			// Check if this looks like a component definition (next token is quoted string or {)
			if strings.HasPrefix(nextToken, "\"") || nextToken == "{" {
				// This looks like a component definition
				if strings.Contains(potentialComponent, ".") {
					// Has a dot - validate it's a known component
					if !isValidComponent(potentialComponent, validComponents) {
						errors = append(errors, ValidationError{
							Line:     lineNum + 1,
							Column:   strings.Index(line, potentialComponent) + 1,
							Message:  fmt.Sprintf("Unknown component '%s'. Did you mean one of: %s?", potentialComponent, suggestSimilarComponents(potentialComponent, validComponents)),
							Severity: "error",
						})
					}
				} else {
					// No dot - this is definitely invalid (e.g., "kubernetes" instead of "discovery.kubernetes")
					errors = append(errors, ValidationError{
						Line:     lineNum + 1,
						Column:   strings.Index(line, potentialComponent) + 1,
						Message:  fmt.Sprintf("Invalid component '%s'. Components must have format 'category.type' (e.g., discovery.kubernetes)", potentialComponent),
						Severity: "error",
					})
				}

				// Check if label is quoted (if not using anonymous block)
				if !strings.HasPrefix(nextToken, "\"") && nextToken != "{" {
					errors = append(errors, ValidationError{
						Line:     lineNum + 1,
						Column:   strings.Index(line, nextToken) + 1,
						Message:  fmt.Sprintf("Component label must be quoted: %s", nextToken),
						Severity: "error",
					})
				}
			}
		}

		// Check for common syntax errors
		if strings.Contains(trimmed, "==") {
			errors = append(errors, ValidationError{
				Line:     lineNum + 1,
				Column:   strings.Index(line, "==") + 1,
				Message:  "Use single '=' for assignment, not '=='",
				Severity: "error",
			})
		}
	}

	// Check for unclosed braces
	if len(braceStack) > 0 {
		errors = append(errors, ValidationError{
			Line:     braceStack[len(braceStack)-1],
			Column:   0,
			Message:  fmt.Sprintf("Unclosed brace - missing %d closing brace(s)", len(braceStack)),
			Severity: "error",
		})
	}

	if quoteOpen {
		errors = append(errors, ValidationError{
			Line:     len(lines),
			Column:   0,
			Message:  "Unclosed string quote",
			Severity: "error",
		})
	}

	return errors
}

func getValidComponentNames() map[string]bool {
	components := catalog.GetComponents(catalog.ComponentFilter{})
	validNames := make(map[string]bool)
	for _, comp := range components {
		// Use the full component name: category.name
		fullName := fmt.Sprintf("%s.%s", comp.Category, comp.Name)
		validNames[fullName] = true
	}
	return validNames
}

func isValidComponent(name string, validComponents map[string]bool) bool {
	return validComponents[name]
}

func suggestSimilarComponents(name string, validComponents map[string]bool) string {
	// Extract category from the attempted component name
	parts := strings.Split(name, ".")
	if len(parts) < 2 {
		return "check component reference"
	}

	category := parts[0]
	suggestions := []string{}

	// Find components in the same category
	for compName := range validComponents {
		if strings.HasPrefix(compName, category+".") {
			suggestions = append(suggestions, compName)
			if len(suggestions) >= 3 {
				break
			}
		}
	}

	if len(suggestions) == 0 {
		return "check component reference"
	}

	return strings.Join(suggestions, ", ")
}

func FormatAlloyConfig(config string) (string, error) {
	// Write config to temporary file
	tmpDir := os.TempDir()
	tmpFile := filepath.Join(tmpDir, fmt.Sprintf("config-%d.alloy", os.Getpid()))

	if err := os.WriteFile(tmpFile, []byte(config), 0644); err != nil {
		return "", fmt.Errorf("failed to write temp file: %w", err)
	}
	defer os.Remove(tmpFile)

	// Execute alloy fmt command
	alloyPath := getEnv("ALLOY_PATH", "alloy")
	cmd := exec.Command(alloyPath, "fmt", tmpFile)

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("format failed: %w", err)
	}

	return strings.TrimSpace(string(output)), nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
