import { assistListingDescription } from "../../../lib/listing-doctor/assistDescription";
import {
  asListingDraft,
  validateListingPayload,
} from "../../../lib/listing-doctor/apiPayload";
import type {
  ApiErrorResponse,
} from "../../../lib/listing-doctor/types";
import type {
  DescriptionAssistantMode,
  DescriptionLanguage,
} from "../../../lib/listing-doctor/descriptionAssistant";

const modes: DescriptionAssistantMode[] = ["scratch", "polish"];
const languages: DescriptionLanguage[] = ["en", "de", "fr", "it"];

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const listing = isRecord(body) ? body.listing : undefined;
    const mode = isRecord(body) ? body.mode : undefined;
    const language = isRecord(body) ? body.language : undefined;
    const details = validateListingPayload(listing);

    if (typeof mode !== "string" || !modes.includes(mode as DescriptionAssistantMode)) {
      details.push("mode must be one of: scratch, polish");
    }

    if (language !== undefined && (typeof language !== "string" || !languages.includes(language as DescriptionLanguage))) {
      details.push("language must be one of: en, de, fr, it");
    }

    if (details.length) {
      return Response.json(
        { error: "Invalid description assistance payload", details } satisfies ApiErrorResponse,
        { status: 400 },
      );
    }

    const result = await assistListingDescription({
      listing: asListingDraft(listing),
      mode: mode as DescriptionAssistantMode,
      language: (language as DescriptionLanguage | undefined) ?? "en",
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof InvalidJsonError) {
      return Response.json(
        {
          error: "Invalid description assistance payload",
          details: ["request body must be valid JSON"],
        } satisfies ApiErrorResponse,
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Failed to assist description" } satisfies ApiErrorResponse,
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
