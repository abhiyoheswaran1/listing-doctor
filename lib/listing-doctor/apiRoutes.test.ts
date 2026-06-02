import { describe, expect, test } from "vitest";

import { POST as diagnoseListing } from "../../app/api/diagnose-listing/route";
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

});
