package catalog

import (
	_ "embed"
	"encoding/json"
)

//go:embed data/recipes.json
var recipesData []byte

type Recipe struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Category      string   `json:"category"`
	Description   string   `json:"description"`
	Difficulty    string   `json:"difficulty"`
	Tags          []string `json:"tags"`
	Signals       []string `json:"signals"`
	Configuration string   `json:"configuration"`
}

type RecipeFilter struct {
	Category   string
	Signal     string
	Difficulty string
}

var recipes []Recipe

func init() {
	var data struct {
		Recipes []Recipe `json:"recipes"`
	}
	if err := json.Unmarshal(recipesData, &data); err != nil {
		// Fallback to empty array if parsing fails
		recipes = []Recipe{}
	} else {
		recipes = data.Recipes
	}
}

func GetRecipes(filter RecipeFilter) []Recipe {
	filtered := make([]Recipe, 0)

	for _, r := range recipes {
		if filter.Category != "" && r.Category != filter.Category {
			continue
		}
		if filter.Difficulty != "" && r.Difficulty != filter.Difficulty {
			continue
		}
		if filter.Signal != "" {
			found := false
			for _, sig := range r.Signals {
				if sig == filter.Signal {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}

		filtered = append(filtered, r)
	}

	return filtered
}
