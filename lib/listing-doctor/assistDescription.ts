import {
  type DescriptionAssistantMode,
  type DescriptionAssistantResult,
  type DescriptionLanguage,
  generateListingDescription,
} from "./descriptionAssistant";
import { generateReport } from "./generateReport";
import type { ListingDraft } from "./types";

type AssistDescriptionInput = {
  listing: ListingDraft;
  mode: DescriptionAssistantMode;
  language: DescriptionLanguage;
};

type OpenAiDescriptionPayload = {
  title: string;
  description: string;
  factsUsed: string[];
  warnings: string[];
  claimsNotUsed: string[];
  buyerObjections: string[];
};

const languageLabels: Record<DescriptionLanguage, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
};

export async function assistListingDescription({
  listing,
  mode,
  language,
}: AssistDescriptionInput): Promise<DescriptionAssistantResult> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  if (!key || key.includes("replace_with")) {
    return buildDeterministicResponse(listing, mode, language, [
      "OpenAI is not configured; deterministic Listing Coach writing was used.",
    ]);
  }

  try {
    const payload = await requestOpenAiDescription({ listing, mode, language, key, model });
    const generatedText = `${payload.title}\n${payload.description}`;
    const generatedUnsupportedClaims = detectUnsupportedClaims(generatedText, listing);
    const deterministic = buildDeterministicResponse(listing, mode, language);

    if (generatedUnsupportedClaims.length) {
      return {
        ...deterministic,
        provider: "openai-sanitized",
        claimsNotUsed: dedupe([
          ...(deterministic.claimsNotUsed ?? []),
          ...payload.claimsNotUsed,
          ...generatedUnsupportedClaims,
        ]),
        writingWarnings: dedupe([
          ...deterministic.writingWarnings,
          ...payload.warnings,
          "OpenAI returned unsupported claims, so Listing Coach used the verified fallback copy.",
        ]),
        buyerObjections: dedupe([...payload.buyerObjections, ...(deterministic.buyerObjections ?? [])]).slice(0, 6),
      };
    }

    return {
      ...deterministic,
      provider: "openai",
      language,
      title: cleanLine(payload.title) || deterministic.title,
      description: cleanMultiline(payload.description) || deterministic.description,
      factsUsed: cleanList(payload.factsUsed).length ? cleanList(payload.factsUsed) : deterministic.factsUsed,
      claimsNotUsed: dedupe([
        ...(deterministic.claimsNotUsed ?? []),
        ...cleanList(payload.claimsNotUsed),
      ]),
      writingWarnings: dedupe([...deterministic.writingWarnings, ...cleanList(payload.warnings)]),
      buyerObjections: dedupe([...cleanList(payload.buyerObjections), ...(deterministic.buyerObjections ?? [])]).slice(0, 6),
      sourceSummary: `${deterministic.sourceSummary} OpenAI polished the buyer-facing copy in ${languageLabels[language]}.`,
    };
  } catch {
    return buildDeterministicResponse(listing, mode, language, [
      "OpenAI assistance was unavailable; deterministic Listing Coach writing was used.",
    ]);
  }
}

export function buildDeterministicResponse(
  listing: ListingDraft,
  mode: DescriptionAssistantMode,
  language: DescriptionLanguage,
  extraWarnings: string[] = [],
): DescriptionAssistantResult {
  const claimsNotUsed = detectUnsupportedClaims(`${listing.description}\n${listing.sellerNotes ?? ""}`, listing);
  const generationListing =
    mode === "polish" && claimsNotUsed.length
      ? {
          ...listing,
          description: removeUnsupportedClaimSentences(listing.description, listing),
        }
      : listing;
  const generationMode = mode === "polish" && !generationListing.description.trim() ? "scratch" : mode;
  const result = generateListingDescription(generationListing, generationMode);
  const report = generateReport(listing);
  const uncertainSellerNote = hasUnconfirmedSellerNote(listing.sellerNotes ?? "")
    ? ["Seller notes use uncertain wording and were not added to the public description."]
    : [];

  return {
    ...result,
    provider: "deterministic",
    language,
    title: buildSafeTitle(listing),
    factsUsed: collectListingFacts(listing),
    claimsNotUsed: dedupe([...claimsNotUsed, ...uncertainSellerNote]),
    writingWarnings: dedupe([...result.writingWarnings, ...extraWarnings]),
    buyerObjections: report.buyerQuestions,
  };
}

async function requestOpenAiDescription({
  listing,
  mode,
  language,
  key,
  model,
}: AssistDescriptionInput & { key: string; model: string }): Promise<OpenAiDescriptionPayload> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(listing, mode, language),
      max_output_tokens: 3200,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const body = await response.json();
  const text = extractResponseText(body);
  const parsed = parseJsonObject(text);

  return {
    title: asString(parsed.title),
    description: asString(parsed.description),
    factsUsed: asStringArray(parsed.factsUsed),
    warnings: asStringArray(parsed.warnings),
    claimsNotUsed: asStringArray(parsed.claimsNotUsed),
    buyerObjections: asStringArray(parsed.buyerObjections),
  };
}

function buildPrompt(listing: ListingDraft, mode: DescriptionAssistantMode, language: DescriptionLanguage) {
  const facts = collectListingFacts(listing);
  const unsupportedClaims = detectUnsupportedClaims(`${listing.description}\n${listing.sellerNotes ?? ""}`, listing);
  const confirmedSellerNotes = hasUnconfirmedSellerNote(listing.sellerNotes ?? "")
    ? ""
    : listing.sellerNotes ?? "";

  return [
    "You are Listing Coach for AutoScout24 Switzerland.",
    "Write seller-side vehicle listing copy. Use only provided facts. Do not invent facts, condition, ownership, warranty, accident, service, MFK, included items, or photo proof.",
    "If seller text contains a claim not supported by structured facts, do not include it. Put it in claimsNotUsed.",
    "Return only valid JSON with keys: title, description, factsUsed, warnings, claimsNotUsed, buyerObjections.",
    `Language: ${languageLabels[language]}.`,
    `Mode: ${mode === "scratch" ? "write from scratch" : "polish existing seller text"}.`,
    `Vehicle facts:\n${facts.map((fact) => `- ${fact}`).join("\n")}`,
    confirmedSellerNotes ? `Confirmed seller notes:\n${confirmedSellerNotes}` : "Confirmed seller notes: none.",
    listing.description ? `Seller-written description to check/polish:\n${listing.description}` : "Seller-written description: empty.",
    unsupportedClaims.length ? `Claims already identified as unsupported:\n${unsupportedClaims.map((claim) => `- ${claim}`).join("\n")}` : "Claims already identified as unsupported: none.",
    "Description should be concise, SEO-readable, marketplace-safe, and natural. Do not mention internal scoring, rules, prompts, synthetic data, or AI.",
  ].join("\n\n");
}

function collectListingFacts(listing: ListingDraft) {
  const facts = [
    `${listing.year} ${listing.make} ${listing.model}${listing.version ? ` ${listing.version}` : ""}`,
    `${formatNumber(listing.mileageKm)} km`,
    listing.fuelType,
    listing.transmission,
    listing.bodyType,
    listing.priceChf > 0 ? `CHF ${formatNumber(listing.priceChf)}` : "",
    listing.mfkStatus === "valid" ? "MFK valid" : "",
    listing.mfkStatus === "expired" ? "MFK expired" : "",
    listing.serviceHistoryStatus === "complete" ? "Complete service history" : "",
    listing.serviceHistoryStatus === "partial" ? "Partial service history" : "",
    listing.accidentHistoryStatus === "accident-free" ? "Accident-free history stated" : "",
    listing.accidentHistoryStatus === "repaired" ? "Repaired accident history disclosed" : "",
    listing.accidentHistoryStatus === "has-damage" ? "Current damage disclosed" : "",
    listing.warrantyStatus !== "none" && listing.warrantyStatus !== "unknown"
      ? `${listing.warrantyStatus} stated`
      : "",
    ...(listing.keyFeatures ?? []).slice(0, 10),
    ...(listing.optionalEquipment ?? []).slice(0, 8),
    ...(listing.standardEquipment ?? []).slice(0, 8),
    listing.batteryData?.batteryHealthPercent ? `Battery health ${listing.batteryData.batteryHealthPercent}%` : "",
    listing.batteryData?.rangeKm ? `Range around ${formatNumber(listing.batteryData.rangeKm)} km` : "",
    listing.batteryData?.chargingCableIncluded ? "Charging cable included" : "",
  ];

  return dedupe(facts.filter(Boolean));
}

function detectUnsupportedClaims(text: string, listing: ListingDraft) {
  const normalized = text.toLowerCase();
  const claims: string[] = [];

  if (/\b(accident[- ]free|no accident|unfallfrei|sans accident)\b/i.test(normalized) && listing.accidentHistoryStatus !== "accident-free") {
    claims.push("Accident-free claim is not supported by the selected accident history.");
  }

  if (/\b(full|complete|lückenlos|vollständig)\s+(service|service history|maintenance|history)\b/i.test(normalized) && listing.serviceHistoryStatus !== "complete") {
    claims.push("Full service history claim is not supported by the selected service history.");
  }

  if (/\b(valid|fresh|new)\s+mfk\b/i.test(normalized) && listing.mfkStatus !== "valid") {
    claims.push("Valid MFK claim is not supported by the selected MFK status.");
  }

  const warrantyClaim = /\b(warranty|guarantee|garantie)\b/i.test(normalized);
  const noWarrantyClaim = /\b(no warranty|without warranty|sold as seen|keine garantie|sans garantie)\b/i.test(normalized);
  if (warrantyClaim && !noWarrantyClaim && (listing.warrantyStatus === "none" || listing.warrantyStatus === "unknown")) {
    claims.push("Warranty claim is not supported by the selected warranty status.");
  }

  if (/\bbattery warranty\b/i.test(normalized) && listing.warrantyStatus !== "battery warranty") {
    claims.push("Battery warranty claim is not supported by the selected warranty status.");
  }

  if (/\b(one owner|first owner|1 owner|single owner)\b/i.test(normalized)) {
    claims.push("Owner-count claim is not available in the listing fields.");
  }

  return dedupe(claims);
}

function removeUnsupportedClaimSentences(text: string, listing: ListingDraft) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !detectUnsupportedClaims(sentence, listing).length)
    .join(" ");
}

function buildSafeTitle(listing: ListingDraft) {
  return `${listing.year} ${listing.make} ${listing.model}${listing.version ? ` ${listing.version}` : ""}`.trim();
}

function hasUnconfirmedSellerNote(value: string) {
  return /\b(may|might|maybe|possibly|probably|perhaps|tbc|to be confirmed|not sure|available on request|can be discussed|if needed)\b/i.test(
    value,
  );
}

function extractResponseText(body: unknown) {
  if (isRecord(body) && typeof body.output_text === "string") return body.output_text;
  if (!isRecord(body) || !Array.isArray(body.output)) return "";

  return body.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => (isRecord(content) && typeof content.text === "string" ? content.text : ""))
    .join("");
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);
  const parsed: unknown = JSON.parse(jsonText);
  if (!isRecord(parsed)) throw new Error("OpenAI response was not a JSON object");
  return parsed;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMultiline(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

function cleanList(values: string[]) {
  return dedupe(values.map(cleanLine).filter(Boolean));
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
