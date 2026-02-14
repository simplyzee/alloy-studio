package api

import (
	"github.com/alloy-studio/backend/pkg/catalog"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(router fiber.Router) {
	router.Post("/validate", validateHandler)
	router.Post("/format", formatHandler)
	router.Get("/components", getComponentsHandler)
	router.Get("/recipes", getRecipesHandler)
}

type ValidateRequest struct {
	Config                     string `json:"config"`
	StabilityLevel             string `json:"stability_level"`
	EnableCommunityComponents  bool   `json:"enable_community_components"`
}

type FormatRequest struct {
	Config string `json:"config"`
}

func validateHandler(c *fiber.Ctx) error {
	var req ValidateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validation disabled - always return valid
	return c.JSON(fiber.Map{
		"valid": true,
		"message": "Validation is currently disabled",
	})
}

func formatHandler(c *fiber.Ctx) error {
	var req FormatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Format disabled - return config as-is
	return c.JSON(fiber.Map{
		"formatted_config": req.Config,
	})
}

func getComponentsHandler(c *fiber.Ctx) error {
	category := c.Query("category")
	signal := c.Query("signal")
	stability := c.Query("stability")
	search := c.Query("search")

	components := catalog.GetComponents(catalog.ComponentFilter{
		Category:  category,
		Signal:    signal,
		Stability: stability,
		Search:    search,
	})

	return c.JSON(components)
}

func getRecipesHandler(c *fiber.Ctx) error {
	category := c.Query("category")
	signal := c.Query("signal")
	difficulty := c.Query("difficulty")

	recipes := catalog.GetRecipes(catalog.RecipeFilter{
		Category:   category,
		Signal:     signal,
		Difficulty: difficulty,
	})

	return c.JSON(recipes)
}
