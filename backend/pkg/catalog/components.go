package catalog

import (
	_ "embed"
	"encoding/json"
	"strings"
)

//go:embed data/components.json
var componentsData []byte

type Argument struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Required    bool        `json:"required"`
	Description string      `json:"description"`
	Default     interface{} `json:"default,omitempty"`
}

type Block struct {
	Name       string     `json:"name"`
	Required   bool       `json:"required"`
	Repeatable bool       `json:"repeatable"`
	Arguments  []Argument `json:"arguments"`
}

type Export struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

type Example struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Code        string `json:"code"`
}

type Component struct {
	ID               string      `json:"id"`
	Category         string      `json:"category"`
	Name             string      `json:"name"`
	DisplayName      string      `json:"displayName"`
	Description      string      `json:"description"`
	Stability        string      `json:"stability"`
	Signals          []string    `json:"signals"`
	Type             string      `json:"type"`
	Arguments        []Argument  `json:"arguments,omitempty"`
	Blocks           []Block     `json:"blocks,omitempty"`
	Exports          []Export    `json:"exports,omitempty"`
	Examples         []Example   `json:"examples,omitempty"`
	DocumentationURL string      `json:"documentationUrl"`
}

type ComponentFilter struct {
	Category  string
	Signal    string
	Stability string
	Search    string
}

var components []Component

func init() {
	var data struct {
		Components []Component `json:"components"`
	}
	if err := json.Unmarshal(componentsData, &data); err != nil {
		// Fallback to empty array if parsing fails
		components = []Component{}
	} else {
		components = data.Components
	}
}

func GetComponents(filter ComponentFilter) []Component {
	filtered := make([]Component, 0)

	for _, c := range components {
		if filter.Category != "" && c.Category != filter.Category {
			continue
		}
		if filter.Stability != "" && c.Stability != filter.Stability {
			continue
		}
		if filter.Signal != "" {
			found := false
			for _, sig := range c.Signals {
				if sig == filter.Signal {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		if filter.Search != "" {
			searchLower := strings.ToLower(filter.Search)
			if !strings.Contains(strings.ToLower(c.Name), searchLower) &&
				!strings.Contains(strings.ToLower(c.Description), searchLower) {
				continue
			}
		}

		filtered = append(filtered, c)
	}

	return filtered
}
