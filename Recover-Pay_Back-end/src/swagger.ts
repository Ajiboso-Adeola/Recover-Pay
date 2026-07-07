import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "RecoverPay API",
    version: "1.0.0",
    description:
      "Managed subscriptions engine with intelligent payment recovery for Nigerian businesses, built on Nomba.",
    contact: { name: "RecoverPay Team" },
  },
  servers: [{ url: "/v1", description: "Current version" }],
  components: {
    securitySchemes: {
      ClerkAuth: {
        type: "http",
        scheme: "bearer",
        description: "Clerk JWT — used by the dashboard frontend",
      },
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        description: "Tenant API key — get yours from the RecoverPay dashboard",
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  tags: [
    { name: "Plans", description: "Manage pricing plans" },
    { name: "Checkout", description: "Start a subscription for a customer" },
    { name: "Subscriptions", description: "Manage subscription lifecycle" },
    { name: "Portal", description: "Customer self-service" },
    { name: "Webhooks", description: "Receive Nomba payment events" },
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register tenant after Clerk signup",
        tags: ["Auth"],
        security: [{ ClerkAuth: [] }],
        responses: { "201": { description: "Tenant created with API key" } },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current tenant profile and stats",
        tags: ["Auth"],
        security: [{ ClerkAuth: [] }],
        responses: { "200": { description: "Tenant profile" } },
      },
    },
    "/auth/regenerate-key": {
      post: {
        summary: "Regenerate API key — old key immediately invalidated",
        tags: ["Auth"],
        security: [{ ClerkAuth: [] }],
        responses: { "200": { description: "New API key" } },
      },
    },
    "/checkout/status": {
      get: {
        summary: "Check payment status by orderReference",
        tags: ["Checkout"],
        parameters: [
          {
            name: "orderReference",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Payment status" },
          "404": { description: "Not found" },
        },
      },
    },

    "/plans": {
      post: {
        summary: "Create a plan",
        tags: ["Plans"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "amount", "interval"],
                properties: {
                  name: { type: "string", example: "Pro Monthly" },
                  amount: {
                    type: "number",
                    example: 5000,
                    description: "Naira amount e.g. 5000 = ₦5,000",
                  },
                  interval: {
                    type: "string",
                    enum: ["monthly", "annual", "custom"],
                  },
                  trialDays: { type: "integer", example: 7 },
                  currency: { type: "string", example: "NGN" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Plan created" },
          "400": { description: "Validation error" },
        },
      },
      get: {
        summary: "List plans",
        tags: ["Plans"],
        responses: { "200": { description: "Array of plans" } },
      },
    },
    "/plans/{id}": {
      get: {
        summary: "Get a plan",
        tags: ["Plans"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Plan" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update a plan",
        tags: ["Plans"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Updated plan" } },
      },
      delete: {
        summary: "Archive a plan",
        tags: ["Plans"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "204": { description: "Archived" } },
      },
    },
    "/checkout/start": {
      post: {
        summary: "Start a subscription checkout",
        tags: ["Checkout"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["customerEmail", "planId"],
                properties: {
                  customerEmail: {
                    type: "string",
                    example: "customer@example.com",
                  },
                  planId: { type: "string", example: "clxxx..." },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Returns a Nomba checkoutUrl to redirect the customer to",
          },
          "404": { description: "Plan not found" },
          "502": { description: "Nomba did not return a checkout URL" },
        },
      },
    },
    "/checkout/complete": {
      get: {
        summary: "Payment return URL — Nomba redirects here after checkout",
        tags: ["Checkout"],
        parameters: [
          {
            name: "orderReference",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Payment confirmed, subscription activated" },
          "402": { description: "Payment not confirmed" },
        },
      },
    },
    "/subscriptions": {
      get: {
        summary: "List subscriptions",
        tags: ["Subscriptions"],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "created",
                "trialing",
                "active",
                "past_due",
                "paused",
                "cancelled",
              ],
            },
          },
        ],
        responses: { "200": { description: "Array of subscriptions" } },
      },
    },
    "/subscriptions/{id}": {
      get: {
        summary: "Get a subscription",
        tags: ["Subscriptions"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Subscription with invoices" },
          "404": { description: "Not found" },
        },
      },
    },
    "/subscriptions/{id}/charge": {
      post: {
        summary: "Manually trigger a billing cycle charge",
        description:
          "Useful for demos — in production the scheduler fires this automatically",
        tags: ["Subscriptions"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Charged successfully" },
          "402": { description: "Charge failed — dunning has been scheduled" },
        },
      },
    },
    "/portal/{customerId}": {
      get: {
        summary: "Customer portal overview",
        tags: ["Portal"],
        security: [],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Customer + subscriptions" },
          "404": { description: "Not found" },
        },
      },
    },
    "/portal/{customerId}/invoices": {
      get: {
        summary: "Customer invoice history",
        tags: ["Portal"],
        security: [],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Array of invoices" } },
      },
    },
    "/portal/{customerId}/subscriptions/{subId}/cancel": {
      post: {
        summary: "Cancel a subscription",
        tags: ["Portal"],
        security: [],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "subId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Cancelled" } },
      },
    },
    "/portal/{customerId}/subscriptions/{subId}/pause": {
      post: {
        summary: "Pause a subscription",
        tags: ["Portal"],
        security: [],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "subId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Paused" } },
      },
    },
    "/portal/{customerId}/subscriptions/{subId}/resume": {
      post: {
        summary: "Resume a paused subscription",
        tags: ["Portal"],
        security: [],
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "subId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Resumed" } },
      },
    },
    "/webhooks/nomba": {
      post: {
        summary: "Nomba webhook receiver",
        description:
          "Not for manual calls — this endpoint receives payment events from Nomba",
        tags: ["Webhooks"],
        security: [],
        responses: {
          "200": { description: "Acknowledged" },
          "401": { description: "Invalid signature" },
        },
      },
    },
  },
};

export function mountSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}
