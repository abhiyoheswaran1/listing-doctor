import type { ListingDraft, PastListing } from "./types";
import {
  optionalEquipmentCatalog,
  standardEquipmentCatalog,
} from "./equipmentCatalog";

type MarketTemplate = {
  make: string;
  model: string;
  version: string;
  fuelType: string;
  bodyType: string;
  basePrice: number;
  yearStart: number;
};

const marketTemplates: MarketTemplate[] = [
  {
    make: "BMW",
    model: "320d Touring",
    version: "xDrive Steptronic",
    fuelType: "Diesel",
    bodyType: "Estate",
    basePrice: 24500,
    yearStart: 2016,
  },
  {
    make: "Toyota",
    model: "RAV4 Hybrid",
    version: "Premium AWD",
    fuelType: "Hybrid",
    bodyType: "SUV",
    basePrice: 36500,
    yearStart: 2020,
  },
  {
    make: "Volkswagen",
    model: "Golf 1.4 TSI",
    version: "Comfortline",
    fuelType: "Petrol",
    bodyType: "Hatchback",
    basePrice: 18000,
    yearStart: 2013,
  },
  {
    make: "Tesla",
    model: "Model Y",
    version: "Long Range AWD",
    fuelType: "Electric",
    bodyType: "SUV / off-road vehicle",
    basePrice: 57500,
    yearStart: 2023,
  },
  {
    make: "Audi",
    model: "A4 Avant 40 TDI",
    version: "S line quattro",
    fuelType: "Diesel",
    bodyType: "Estate",
    basePrice: 33800,
    yearStart: 2019,
  },
  {
    make: "Mercedes-Benz",
    model: "GLC 300e 4MATIC",
    version: "AMG Line",
    fuelType: "Plug-in hybrid",
    bodyType: "SUV",
    basePrice: 48900,
    yearStart: 2021,
  },
  {
    make: "Skoda",
    model: "Octavia Combi 2.0 TDI",
    version: "Style DSG",
    fuelType: "Diesel",
    bodyType: "Estate",
    basePrice: 22800,
    yearStart: 2018,
  },
  {
    make: "Volvo",
    model: "XC60 B5 AWD",
    version: "Momentum",
    fuelType: "Petrol mild hybrid",
    bodyType: "SUV",
    basePrice: 42900,
    yearStart: 2021,
  },
  {
    make: "Peugeot",
    model: "3008 Hybrid",
    version: "GT Pack",
    fuelType: "Plug-in hybrid",
    bodyType: "SUV",
    basePrice: 38900,
    yearStart: 2021,
  },
  {
    make: "Ford",
    model: "Kuga 2.5 PHEV",
    version: "ST-Line X",
    fuelType: "Plug-in hybrid",
    bodyType: "SUV",
    basePrice: 34900,
    yearStart: 2021,
  },
  {
    make: "Hyundai",
    model: "Tucson 1.6 T-GDi",
    version: "Vertex 4WD",
    fuelType: "Hybrid",
    bodyType: "SUV",
    basePrice: 36900,
    yearStart: 2022,
  },
  {
    make: "Kia",
    model: "Sportage 1.6 T-GDi",
    version: "Style 4x4",
    fuelType: "Hybrid",
    bodyType: "SUV",
    basePrice: 34500,
    yearStart: 2022,
  },
  {
    make: "Porsche",
    model: "Macan",
    version: "S PDK",
    fuelType: "Petrol",
    bodyType: "SUV",
    basePrice: 68900,
    yearStart: 2020,
  },
  {
    make: "Mini",
    model: "Cooper SE",
    version: "Trim XL",
    fuelType: "Electric",
    bodyType: "Hatchback",
    basePrice: 28500,
    yearStart: 2021,
  },
  {
    make: "Fiat",
    model: "500e",
    version: "Icon",
    fuelType: "Electric",
    bodyType: "Small car",
    basePrice: 22900,
    yearStart: 2021,
  },
  {
    make: "Nissan",
    model: "Qashqai 1.3 DIG-T",
    version: "Tekna+",
    fuelType: "Petrol mild hybrid",
    bodyType: "SUV",
    basePrice: 31900,
    yearStart: 2021,
  },
  {
    make: "Seat",
    model: "Leon ST 1.5 eTSI",
    version: "FR DSG",
    fuelType: "Petrol mild hybrid",
    bodyType: "Estate",
    basePrice: 25900,
    yearStart: 2020,
  },
  {
    make: "Mazda",
    model: "CX-5 Skyactiv-G",
    version: "Revolution AWD",
    fuelType: "Petrol",
    bodyType: "SUV",
    basePrice: 32900,
    yearStart: 2020,
  },
  {
    make: "Opel",
    model: "Corsa-e",
    version: "Elegance",
    fuelType: "Electric",
    bodyType: "Small car",
    basePrice: 21900,
    yearStart: 2021,
  },
  {
    make: "Dacia",
    model: "Duster TCe",
    version: "Journey 4x4",
    fuelType: "Petrol",
    bodyType: "SUV",
    basePrice: 17900,
    yearStart: 2020,
  },
];

const regions = ["ZH", "BE", "VD", "BS", "TI", "GE", "LU", "SG"];
const productionMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "September",
  "October",
  "November",
];
const listingMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const mockPastListings: PastListing[] = marketTemplates.flatMap((template, templateIndex) =>
  Array.from({ length: 500 }, (_, index) => {
    const mileageKm = roundTo(
      9000 + ((index * 13729 + templateIndex * 4200) % 235000),
      500,
    );
    const year = template.yearStart - (index % 7) + Math.floor((index % 12) / 6);
    const productionYear = year;
    const productionMonth = productionMonths[(index + templateIndex) % productionMonths.length] ?? "January";
    const firstRegistrationYear = Math.min(2026, productionYear + (index % 5 === 0 ? 1 : 0));
    const firstRegistrationMonth = productionMonths[(index * 2 + templateIndex) % productionMonths.length] ?? productionMonth;
    const listingMonth = listingMonths[(index * 5 + templateIndex * 2) % listingMonths.length] ?? "January";
    const seasonalityIndex = getSeasonalityIndex(template, listingMonth);
    const listingAgeDays = getListingAgeDays(index, templateIndex);
    const listingAgeBucket = getListingAgeBucket(listingAgeDays);
    const sellerType = index % 4 === 0 ? "private" : "dealer";
    const sellerResponseTimeHours =
      sellerType === "dealer"
        ? clamp(2 + ((index * 3 + templateIndex) % 22), 1, 36)
        : clamp(8 + ((index * 7 + templateIndex * 2) % 64), 4, 96);
    const sellerResponseScore = clamp(Math.round(100 - sellerResponseTimeHours * 0.9 + (sellerType === "dealer" ? 8 : 0)), 18, 100);
    const dealerCertified = sellerType === "dealer" && (index + templateIndex) % 3 !== 0;
    const dealerWarrantyIncluded = sellerType === "dealer" && (dealerCertified || (index + templateIndex) % 5 === 0);
    const mileageAdjustment = mileageKm * 0.018;
    const ageAdjustment = Math.max(0, 2026 - year) * 720;
    const qualitySwing = ((index % 9) - 4) * 620;
    const standardEquipment = pickCatalogItems(
      standardEquipmentCatalog,
      12 + ((index * 7 + templateIndex * 3) % 36),
      index + templateIndex,
    );
    const optionalEquipment = pickCatalogItems(
      optionalEquipmentCatalog,
      (index + templateIndex) % 7,
      index * 3 + templateIndex,
    );
    const photoCoverageScore = clamp(42 + ((index * 13 + templateIndex * 9) % 58), 20, 100);
    const imageQualityScore = clamp(48 + ((index * 17 + templateIndex * 11) % 52), 25, 100);
    const descriptionQualityScore = clamp(45 + ((index * 19 + templateIndex * 5) % 55), 20, 100);
    const equipmentValueAdjustment = optionalEquipment.length * 280 + standardEquipment.length * 18;
    const priceChf = Math.max(
      2900,
      roundTo(template.basePrice - mileageAdjustment - ageAdjustment + qualitySwing + equipmentValueAdjustment, 100),
    );
    const qualityScore = clamp(
      Math.round(
        34 +
          photoCoverageScore * 0.2 +
          imageQualityScore * 0.16 +
          descriptionQualityScore * 0.18 +
          Math.min(18, standardEquipment.length * 0.35 + optionalEquipment.length * 1.4) +
          (index % 11),
      ),
      38,
      98,
    );
    const ageCurveMultiplier = getListingAgeMultiplier(listingAgeDays);
    const sellerTrustBoost = sellerType === "dealer" ? 1.08 : 0.94;
    const certifiedBoost = dealerCertified ? 1.08 : 1;
    const viewCount = clamp(
      Math.round((90 + qualityScore * 6 + (index % 17) * 18) * seasonalityIndex * ageCurveMultiplier),
      70,
      1650,
    );
    const leadCount = clamp(
      Math.round((qualityScore / 8 + (index % 5)) * seasonalityIndex * sellerTrustBoost * certifiedBoost),
      2,
      30,
    );
    const favoriteCount = clamp(Math.round(viewCount * (0.035 + qualityScore / 4000)), 2, 95);
    const contactRate = Number(((leadCount / viewCount) * (sellerResponseScore / 82)).toFixed(3));
    const daysToSell = clamp(
      Math.round((7 + (100 - qualityScore) + (index % 5) * 3) / seasonalityIndex + sellerResponseTimeHours / 12),
      5,
      96,
    );
    const priceReductionCount =
      listingAgeDays > 75
        ? 2
        : listingAgeDays > 35 && qualityScore < 78
          ? 1
          : qualityScore >= 82
            ? index % 13 === 0
              ? 1
              : 0
            : index % 4 === 0
              ? 1
              : 0;
    const priceChangeDaysAgo = priceReductionCount ? clamp((index * 5 + templateIndex) % Math.max(8, listingAgeDays), 3, listingAgeDays) : 0;
    const sold = index % 5 !== 0;
    const successful = sold && (qualityScore >= 82 || contactRate >= 0.035 || daysToSell <= 24);

    return {
      id: `past-${slug(template.make)}-${slug(template.model)}-${index + 1}`,
      make: template.make,
      model: template.model,
      version: template.version,
      year,
      productionMonth,
      productionYear,
      firstRegistrationMonth,
      firstRegistrationYear,
      mileageKm,
      priceChf,
      fuelType: template.fuelType,
      bodyType: template.bodyType,
      sellerType,
      region: regions[(index + templateIndex) % regions.length] ?? "ZH",
      listingMonth,
      seasonalityIndex,
      listingAgeDays,
      listingAgeBucket,
      sellerResponseTimeHours,
      sellerResponseScore,
      dealerCertified,
      dealerWarrantyIncluded,
      priceChangeDaysAgo,
      standardEquipment,
      optionalEquipment,
      photoCoverageScore,
      imageQualityScore,
      descriptionQualityScore,
      viewCount,
      daysToSell,
      leadCount,
      favoriteCount,
      contactRate,
      priceReductionCount,
      qualityScore,
      sold,
      successful,
    };
  }),
);

export const MOCK_PAST_LISTING_COUNT = mockPastListings.length;

export function getComparablePastListings(listing: ListingDraft) {
  const make = listing.make.toLowerCase();
  const model = listing.model.toLowerCase();
  const modelRoot = model.split(/\s+/)[0] ?? model;

  const exact = mockPastListings.filter(
    (item) =>
      item.make.toLowerCase() === make &&
      (item.model.toLowerCase() === model || item.model.toLowerCase().includes(modelRoot)),
  );

  if (exact.length >= 8) return exact;

  const segment = mockPastListings.filter(
    (item) =>
      item.bodyType.toLowerCase().includes(listing.bodyType.toLowerCase().split(/\s+/)[0] ?? "") ||
      item.fuelType.toLowerCase().includes(listing.fuelType.toLowerCase().split(/\s+/)[0] ?? ""),
  );

  return [...exact, ...segment].slice(0, 240);
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickCatalogItems(items: string[], count: number, seed: number) {
  const selected: string[] = [];

  for (let offset = 0; selected.length < Math.min(count, items.length); offset += 1) {
    const item = items[(seed + offset * 7) % items.length];
    if (item && !selected.includes(item)) selected.push(item);
  }

  return selected;
}

function getSeasonalityIndex(template: MarketTemplate, month: string) {
  const monthIndex = listingMonths.indexOf(month);
  const winter = [10, 11, 0, 1].includes(monthIndex);
  const spring = [2, 3, 4].includes(monthIndex);
  const summer = [5, 6, 7].includes(monthIndex);
  const autumn = [8, 9].includes(monthIndex);
  let index = 1;

  if (/suv|estate/i.test(template.bodyType) && winter) index += 0.12;
  if (/electric/i.test(template.fuelType) && spring) index += 0.1;
  if (/small car|hatchback/i.test(template.bodyType) && summer) index += 0.08;
  if (/diesel/i.test(template.fuelType) && autumn) index += 0.06;
  if (/porsche|bmw|audi|mercedes/i.test(template.make) && spring) index += 0.05;
  if (month === "December") index -= 0.08;
  if (month === "January") index -= 0.03;

  return Number(clamp(index, 0.82, 1.22).toFixed(2));
}

function getListingAgeDays(index: number, templateIndex: number) {
  const raw = 1 + ((index * 11 + templateIndex * 17) % 118);

  if (index % 11 === 0) return 3 + (templateIndex % 4);
  if (index % 13 === 0) return 82 + ((index + templateIndex) % 38);

  return raw;
}

function getListingAgeBucket(days: number): PastListing["listingAgeBucket"] {
  if (days <= 7) return "first-week";
  if (days <= 30) return "active";
  if (days <= 75) return "aging";
  return "stale";
}

function getListingAgeMultiplier(days: number) {
  if (days <= 7) return 0.58 + days * 0.07;
  if (days <= 30) return 1.05;
  if (days <= 75) return 1.18;
  return 1.28;
}
