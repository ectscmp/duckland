const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Duckland API",
    version: "1.0.0",
    description: "API documentation for Duckland duck management endpoints.",
  },
  servers: [{ url: "/" }],
  tags: [{ name: "Ducks", description: "Duck CRUD operations" }],
  components: {
    schemas: {
      DuckColor: {
        type: "string",
        pattern: "^#[0-9A-Fa-f]{6}$",
        example: "#f0d35f",
      },
      DuckParts: {
        type: "object",
        required: ["head", "front1", "front2", "back1", "back2"],
        properties: {
          head: { $ref: "#/components/schemas/DuckColor" },
          front1: { $ref: "#/components/schemas/DuckColor" },
          front2: { $ref: "#/components/schemas/DuckColor" },
          back1: { $ref: "#/components/schemas/DuckColor" },
          back2: { $ref: "#/components/schemas/DuckColor" },
        },
      },
      DuckStats: {
        type: "object",
        required: ["strength", "health", "focus", "intelligence", "kindness"],
        properties: {
          strength: { type: "number", example: 5 },
          health: { type: "number", example: 8 },
          focus: { type: "number", example: 7 },
          intelligence: { type: "number", example: 6 },
          kindness: { type: "number", example: 9 },
        },
      },
      Duck: {
        type: "object",
        required: [
          "name",
          "assember",
          "adjectives",
          "body",
          "derpy",
          "bio",
          "date",
          "approved",
          "stats",
        ],
        properties: {
          _id: { type: "string", example: "67c60fce854914bf18568eca" },
          name: { type: "string", example: "Sir Quacksalot" },
          assember: { type: "string", example: "Blandd" },
          adjectives: {
            type: "array",
            items: { type: "string" },
            example: ["brave", "chill", "speedy"],
          },
          body: { $ref: "#/components/schemas/DuckParts" },
          derpy: { type: "boolean", example: true },
          bio: { type: "string", example: "A focused duck with legendary kindness." },
          date: { type: "string", format: "date-time", example: "2026-03-03T00:00:00.000Z" },
          approved: { type: "boolean", example: false },
          stats: { $ref: "#/components/schemas/DuckStats" },
        },
      },
      DuckCreateRequest: {
        allOf: [{ $ref: "#/components/schemas/Duck" }],
      },
      DuckUpdateRequest: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          assember: { type: "string" },
          adjectives: { type: "array", items: { type: "string" } },
          body: { $ref: "#/components/schemas/DuckParts" },
          derpy: { type: "boolean" },
          bio: { type: "string" },
          date: { type: "string", format: "date-time" },
          approved: { type: "boolean" },
          stats: { $ref: "#/components/schemas/DuckStats" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/ducks": {
      get: {
        tags: ["Ducks"],
        summary: "Get all ducks",
        responses: {
          200: {
            description: "All ducks",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Duck" } },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
      post: {
        tags: ["Ducks"],
        summary: "Create a new duck",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DuckCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Created duck",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Duck" } },
            },
          },
          400: {
            description: "Invalid request body",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
    "/ducks/{id}": {
      get: {
        tags: ["Ducks"],
        summary: "Get duck by id",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Duck",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Duck" } },
            },
          },
          400: {
            description: "Invalid id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          404: {
            description: "Not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
      patch: {
        tags: ["Ducks"],
        summary: "Update a duck",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DuckUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated duck",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Duck" } },
            },
          },
          400: {
            description: "Invalid id or body",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          404: {
            description: "Not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
      delete: {
        tags: ["Ducks"],
        summary: "Delete a duck",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message", "duck"],
                  properties: {
                    message: { type: "string", example: "Duck deleted." },
                    duck: { $ref: "#/components/schemas/Duck" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          404: {
            description: "Not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
  },
} as const;

export default openApiSpec;
