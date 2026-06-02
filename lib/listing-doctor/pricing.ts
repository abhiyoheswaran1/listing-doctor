import type { ListingDraft, PastListing } from "./types";

const CURRENT_YEAR = 2026;

type PriceBenchmark = {
  adjustedMidpoint: number;
  benchmarkLow: number;
  benchmarkHigh: number;
  originalNewPriceEstimate: number;
  valuationFactors: string[];
};

export function estimateOriginalNewPrice(listing: ListingDraft) {
  const vehicle = normalizeText(`${listing.make} ${listing.model}`);
  let base = 42000;

  if (vehicle.includes("tesla") && vehicle.includes("model y")) base = 68000;
  else if (vehicle.includes("rav4")) base = 48000;
  else if (vehicle.includes("320d")) base = 62000;
  else if (vehicle.includes("golf")) base = 31000;
  else if (vehicle.includes("a4 avant")) base = 64000;
  else if (vehicle.includes("glc")) base = 76000;
  else if (vehicle.includes("octavia")) base = 41000;
  else if (vehicle.includes("xc60")) base = 72000;
  else if (/suv/i.test(listing.bodyType)) base = 56000;
  else if (/touring|estate|wagon|combi/i.test(listing.bodyType)) base = 52000;

  if (/xdrive|quattro|4matic|awd/i.test(`${listing.version ?? ""} ${listing.model}`)) base += 2500;
  if (/performance|amg|s line|premium/i.test(`${listing.version ?? ""}`)) base += 3500;

  return roundToNearestHundred(base);
}

export function buildPriceBenchmark(
  listing: ListingDraft,
  comparableListings: PastListing[],
): PriceBenchmark {
  const age = getVehicleAge(listing);
  const originalNewPriceEstimate = estimateOriginalNewPrice(listing);
  const expectedMileage = getExpectedMileage(listing, age);
  const mileageFactor = getMileageFactor(listing, expectedMileage);
  const ageRetention = getAgeRetention(listing, age);
  const oldHighMileageDieselFactor =
    /diesel/i.test(listing.fuelType) && age >= 8 && listing.mileageKm >= 140000 ? 0.95 : 1;

  const ruleMidpoint =
    originalNewPriceEstimate * ageRetention * mileageFactor * oldHighMileageDieselFactor;
  const closeMedian = medianNumber(getCloseComparablePrices(listing, comparableListings));
  const adjustedMidpoint = closeMedian
    ? ruleMidpoint * 0.72 + closeMedian * 0.28
    : ruleMidpoint;
  const bandWidth = getBandWidth(listing, age);

  return {
    adjustedMidpoint: roundToNearestHundred(adjustedMidpoint),
    benchmarkLow: roundToNearestHundred(adjustedMidpoint * (1 - bandWidth)),
    benchmarkHigh: roundToNearestHundred(adjustedMidpoint * (1 + bandWidth)),
    originalNewPriceEstimate,
    valuationFactors: [
      `${age} years old`,
      `${formatKm(listing.mileageKm)} km`,
      `expected ${formatKm(expectedMileage)} km for age`,
      `${Math.round(ageRetention * 100)}% age retention`,
      `${Math.round(mileageFactor * 100)}% mileage factor`,
    ],
  };
}

function getVehicleAge(listing: ListingDraft) {
  const registrationYear = listing.firstRegistrationYear || listing.productionYear || listing.year;
  return Math.max(0, CURRENT_YEAR - registrationYear);
}

function getExpectedMileage(listing: ListingDraft, age: number) {
  const annualKm = /diesel/i.test(listing.fuelType)
    ? 15000
    : /electric|hybrid/i.test(listing.fuelType)
      ? 14000
      : 13000;

  return Math.max(8000, age * annualKm);
}

function getMileageFactor(listing: ListingDraft, expectedMileage: number) {
  const delta = listing.mileageKm - expectedMileage;

  if (delta <= 0) {
    return clamp(1 + Math.abs(delta) / 420000, 1, 1.08);
  }

  const penaltyDenominator = /diesel/i.test(listing.fuelType) ? 280000 : 320000;
  return clamp(1 - delta / penaltyDenominator, 0.68, 1);
}

function getAgeRetention(listing: ListingDraft, age: number) {
  const fuel = listing.fuelType;
  const annualRetention = /hybrid/i.test(fuel)
    ? 0.93
    : /electric/i.test(fuel)
      ? 0.91
      : /diesel/i.test(fuel)
        ? 0.84
        : 0.86;
  const floor = /hybrid|electric/i.test(fuel) ? 0.28 : /diesel/i.test(fuel) ? 0.15 : 0.16;

  return Math.max(Math.pow(annualRetention, age), floor);
}

function getBandWidth(listing: ListingDraft, age: number) {
  const highMileage = listing.mileageKm > getExpectedMileage(listing, age) * 1.15;

  if (age >= 10 || highMileage) return 0.1;
  if (age <= 3) return 0.11;
  return 0.12;
}

function getCloseComparablePrices(listing: ListingDraft, comparableListings: PastListing[]) {
  const year = listing.firstRegistrationYear || listing.year;
  const close = comparableListings.filter(
    (item) =>
      Math.abs(item.year - year) <= 2 &&
      Math.abs(item.mileageKm - listing.mileageKm) <= 45000,
  );

  return close.map((item) => item.priceChf);
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function roundToNearestHundred(value: number) {
  return Math.round(value / 100) * 100;
}

function medianNumber(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

function formatKm(value: number) {
  return Math.round(value).toLocaleString("de-CH");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
