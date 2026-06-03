import { describe, expect, test } from "vitest";

import { POST as assistDescription } from "../../app/api/assist-description/route";
import { POST as diagnoseListing } from "../../app/api/diagnose-listing/route";
import { generateListingDescription } from "./descriptionAssistant";
import { demoListings } from "./demoListings";
import { generateReport } from "./generateReport";

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("diagnosis API routes", () => {
  test("structured listing route returns the shared generated report", async () => {
    const listing = demoListings[0];
    const response = await diagnoseListing(jsonRequest("/api/diagnose-listing", { listing }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe("structured");
    expect(payload.diagnosis.scores).toEqual(generateReport(listing).scores);
    expect(payload.diagnosis.improvedTitle).toBe(generateReport(listing).improvedTitle);
  });

  test("structured listing route rejects missing listing payload", async () => {
    const response = await diagnoseListing(jsonRequest("/api/diagnose-listing", {}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid listing payload");
    expect(payload.details).toContain("listing is required");
  });

  test("structured listing route diagnoses drafts before a description is written", async () => {
    const listing = { ...demoListings[0], description: "" };
    const response = await diagnoseListing(jsonRequest("/api/diagnose-listing", { listing }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe("structured");
    expect(payload.diagnosis.scores.descriptionQuality).toBeLessThan(60);
    expect(payload.diagnosis.descriptionFeedback.join(" ")).toMatch(/short|description/i);
  });
});

describe("description assistance API route", () => {
  test("returns deterministic fallback when OpenAI is not configured", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    const originalModel = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;

    try {
      const listing = {
        ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
        description: "",
      };
      const response = await assistDescription(
        jsonRequest("/api/assist-description", {
          listing,
          mode: "scratch",
          language: "en",
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.provider).toBe("deterministic");
      expect(payload.description).toBe(generateListingDescription(listing, "scratch").description);
      expect(payload.claimsNotUsed).toContain("Seller notes use uncertain wording and were not added to the public description.");
      expect(payload.description).not.toContain("winter wheels may be available");
    } finally {
      process.env.OPENAI_API_KEY = originalKey;
      process.env.OPENAI_MODEL = originalModel;
    }
  });

  test("rejects invalid description assistance payloads", async () => {
    const response = await assistDescription(jsonRequest("/api/assist-description", { mode: "scratch" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid description assistance payload");
    expect(payload.details).toContain("listing is required");
  });

  test("sanitizes unsupported claims returned by OpenAI", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    const originalModel = process.env.OPENAI_MODEL;
    const originalFetch = global.fetch;
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-5-mini";
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            title: "Accident-free BMW 320d with full service history",
            description:
              "Accident-free BMW 320d with full service history, valid MFK, and warranty.",
            factsUsed: ["BMW 320d"],
            warnings: [],
            claimsNotUsed: [],
            buyerObjections: ["Can the seller prove the maintenance?"],
          }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    try {
      const listing = {
        ...demoListings.find((item) => item.id === "demo-bmw-320d-weak")!,
        description: "Accident-free car with full service history and warranty.",
      };
      const response = await assistDescription(
        jsonRequest("/api/assist-description", {
          listing,
          mode: "polish",
          language: "en",
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.provider).toBe("openai-sanitized");
      expect(payload.claimsNotUsed.join(" ")).toMatch(/accident-free|full service history|warranty/i);
      expect(payload.description).not.toContain("Accident-free");
      expect(payload.description).not.toContain("full service history");
      expect(payload.description).not.toContain("warranty.");
    } finally {
      process.env.OPENAI_API_KEY = originalKey;
      process.env.OPENAI_MODEL = originalModel;
      global.fetch = originalFetch;
    }
  });

  test("requests OpenAI with a low-latency payload that leaves budget for description text", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    const originalModel = process.env.OPENAI_MODEL;
    const originalFetch = global.fetch;
    let requestBody: Record<string, unknown> | null = null;

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-5-mini";
    global.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    title: "2016 BMW 320d Touring xDrive Steptronic",
                    description: "2016 BMW 320d Touring with verified listing facts.",
                    factsUsed: ["BMW 320d"],
                    warnings: [],
                    claimsNotUsed: [],
                    buyerObjections: [],
                  }),
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    try {
      const listing = demoListings.find((item) => item.id === "demo-bmw-320d-weak")!;
      const response = await assistDescription(
        jsonRequest("/api/assist-description", {
          listing,
          mode: "scratch",
          language: "en",
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.provider).toBe("openai");
      expect(requestBody?.model).toBe("gpt-5-mini");
      expect(requestBody?.reasoning).toEqual({ effort: "minimal" });
      expect(requestBody?.text).toEqual({ verbosity: "low" });
      expect(requestBody?.max_output_tokens).toBeGreaterThanOrEqual(2400);
    } finally {
      process.env.OPENAI_API_KEY = originalKey;
      process.env.OPENAI_MODEL = originalModel;
      global.fetch = originalFetch;
    }
  });
});
