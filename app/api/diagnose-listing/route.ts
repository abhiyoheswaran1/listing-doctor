import {
  asListingDraft,
  validateListingPayload,
} from "../../../lib/listing-doctor/apiPayload";
import { generateReport } from "../../../lib/listing-doctor/generateReport";
import type {
  ApiErrorResponse,
  StructuredDiagnosisResponse,
} from "../../../lib/listing-doctor/types";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const listing = isRecord(body) ? body.listing : undefined;
    const details = validateListingPayload(listing);

    if (details.length) {
      return Response.json(
        { error: "Invalid listing payload", details } satisfies ApiErrorResponse,
        { status: 400 },
      );
    }

    const typedListing = asListingDraft(listing);
    const diagnosis = generateReport(typedListing);

    return Response.json({
      source: "structured",
      listing: typedListing,
      diagnosis,
    } satisfies StructuredDiagnosisResponse);
  } catch (error) {
    if (error instanceof InvalidJsonError) {
      return Response.json(
        {
          error: "Invalid listing payload",
          details: ["request body must be valid JSON"],
        } satisfies ApiErrorResponse,
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Failed to diagnose listing" } satisfies ApiErrorResponse,
      { status: 500 },
    );
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new InvalidJsonError();
  }
}

class InvalidJsonError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
