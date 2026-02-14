package main

import (
	"log"
	"os"

	"github.com/alloy-studio/backend/pkg/api"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "Alloy Studio API",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: getEnv("CORS_ORIGIN", "http://localhost:5173"),
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy"})
	})

	// API routes
	apiGroup := app.Group("/api")
	api.SetupRoutes(apiGroup)

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Starting Alloy Studio API on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
