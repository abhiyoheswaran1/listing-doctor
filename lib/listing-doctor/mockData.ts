import { completePhotoChecklist, emptyPhotoChecklist } from "./demoListings";
import {
  optionalEquipmentCatalog,
  retrofitCatalog,
  standardEquipmentCatalog,
} from "./equipmentCatalog";
import type {
  AccidentHistoryStatus,
  ListingDraft,
  MfkStatus,
  ServiceHistoryStatus,
  WarrantyStatus,
} from "./types";

type VehicleTemplate = {
  make: string;
  model: string;
  version: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  features: string[];
  powerHp: number;
  powerKw: number;
};

const vehicleTemplates: VehicleTemplate[] = [
  {
    make: "Audi",
    model: "A4 Avant 40 TDI",
    version: "S line quattro",
    fuelType: "Diesel",
    transmission: "Automatic",
    bodyType: "Estate",
    features: ["Virtual cockpit", "Navigation", "Quattro", "LED headlights"],
    powerHp: 204,
    powerKw: 150,
  },
  {
    make: "Skoda",
    model: "Octavia Combi 2.0 TDI",
    version: "Style DSG",
    fuelType: "Diesel",
    transmission: "Automatic",
    bodyType: "Estate",
    features: ["Adaptive cruise control", "Tow bar", "Winter wheels", "Parking sensors"],
    powerHp: 150,
    powerKw: 110,
  },
  {
    make: "Mercedes-Benz",
    model: "GLC 300e 4MATIC",
    version: "AMG Line",
    fuelType: "Plug-in hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    features: ["4MATIC", "Panoramic roof", "Burmester sound", "Charging cable"],
    powerHp: 313,
    powerKw: 230,
  },
  {
    make: "Renault",
    model: "Zoe R135",
    version: "Intens",
    fuelType: "Electric",
    transmission: "Automatic",
    bodyType: "Hatchback",
    features: ["Battery lease included", "Type 2 cable", "Heat pump", "Navigation"],
    powerHp: 136,
    powerKw: 100,
  },
  {
    make: "Volvo",
    model: "XC60 B5 AWD",
    version: "Momentum",
    fuelType: "Petrol mild hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    features: ["Pilot Assist", "Leather seats", "Rear camera", "Winter package"],
    powerHp: 250,
    powerKw: 184,
  },
];

const cantonNotes = [
  "Zurich vehicle, available for viewing near Oerlikon.",
  "Bern registered vehicle with two keys.",
  "Vaud vehicle, garage kept and non-smoking.",
  "Basel area vehicle with motorway mileage.",
  "Ticino vehicle, imported through an official Swiss dealer.",
];

export function generateMockListing(seed: string): ListingDraft {
  const random = createSeededRandom(seed);
  const template = pick(vehicleTemplates, random);
  const quality = random();
  const year = randomInt(random, 2014, 2024);
  const month = pick(
    ["January", "February", "March", "April", "May", "June", "September", "October"],
    random,
  );
  const age = Math.max(1, 2026 - year);
  const mileageKm = roundTo(randomInt(random, 9000 * age, 23000 * age + 18000), 500);
  const priceChf = roundTo(randomInt(random, 6500, 62000) - age * 850, 100);
  const strongDraft = quality > 0.55;
  const weakDraft = quality < 0.28;

  const mfkStatus: MfkStatus = strongDraft ? "valid" : weakDraft ? "unknown" : pick(["valid", "expired"], random);
  const serviceHistoryStatus: ServiceHistoryStatus = strongDraft
    ? "complete"
    : weakDraft
      ? "unknown"
      : pick(["complete", "partial"], random);
  const accidentHistoryStatus: AccidentHistoryStatus = strongDraft
    ? "accident-free"
    : weakDraft
      ? "unknown"
      : pick(["accident-free", "repaired"], random);
  const warrantyStatus: WarrantyStatus = /electric|hybrid/i.test(template.fuelType)
    ? strongDraft
      ? "battery warranty"
      : pick(["unknown", "none"], random)
    : strongDraft
      ? pick(["dealer warranty", "manufacturer warranty"], random)
      : pick(["none", "unknown"], random);

  const photoCount = strongDraft ? randomInt(random, 14, 24) : weakDraft ? randomInt(random, 3, 8) : randomInt(random, 8, 15);
  const photoChecklist = strongDraft
    ? completePhotoChecklist
    : {
        ...emptyPhotoChecklist,
        frontExterior: true,
        rearExterior: random() > 0.15,
        leftSide: random() > 0.35,
        rightSide: random() > 0.45,
        interior: random() > 0.45,
        dashboard: random() > 0.55,
        odometer: random() > 0.65,
        tyres: random() > 0.6,
        serviceBook: serviceHistoryStatus === "complete" && random() > 0.35,
        defectsDamage: accidentHistoryStatus !== "unknown" && random() > 0.5,
      };

  const uploadedImages = buildUploadedImages(photoChecklist, photoCount);
  const features = strongDraft ? template.features : template.features.slice(0, randomInt(random, 0, 3));
  const standardEquipment = pickMany(
    standardEquipmentCatalog,
    strongDraft ? randomInt(random, 34, 52) : weakDraft ? randomInt(random, 6, 18) : randomInt(random, 20, 34),
    random,
  );
  const optionalEquipment = pickMany(
    optionalEquipmentCatalog,
    strongDraft ? randomInt(random, 4, 9) : weakDraft ? randomInt(random, 0, 2) : randomInt(random, 2, 5),
    random,
  );
  const retrofits = pickMany(
    retrofitCatalog,
    strongDraft ? randomInt(random, 1, 3) : randomInt(random, 0, 1),
    random,
  );
  const trustSentence = strongDraft
    ? `Documented ${serviceHistoryStatus} service history, ${mfkStatus} MFK, ${accidentHistoryStatus} history, and ${warrantyStatus}.`
    : "Basic details still need to be confirmed before publication.";

  return {
    id: `mock-${slugify(seed)}-${Math.abs(hashSeed(seed)).toString(36)}`,
    name: `${strongDraft ? "Strong" : weakDraft ? "Weak" : "Average"} ${template.make} ${template.model}`,
    make: template.make,
    model: template.model,
    version: template.version,
    year,
    productionMonth: month,
    productionYear: year,
    firstRegistrationMonth: month,
    firstRegistrationYear: year,
    priceChf: Math.max(2900, priceChf),
    mileageKm,
    fuelType: template.fuelType,
    transmission: template.transmission,
    bodyType: template.bodyType,
    sellerType: strongDraft ? "dealer" : pick(["private", "dealer"], random),
    mfkStatus,
    serviceHistoryStatus,
    accidentHistoryStatus,
    warrantyStatus,
    exteriorColor: pick(["Black", "White", "Grey", "Silver", "Blue", "Red"], random),
    interiorColor: pick(["Black", "Grey", "Brown", "Beige"], random),
    metallic: random() > 0.45,
    description: `${template.make} ${template.model} with ${mileageKm.toLocaleString("de-CH")} km. ${trustSentence} Equipment includes ${features.length > 0 ? features.join(", ") : "standard equipment"}.`,
    photoCount: uploadedImages.length,
    uploadedImages,
    photoChecklist,
    keyFeatures: features,
    standardEquipment,
    optionalEquipment,
    retrofits,
    technicalData: {
      doors: 5,
      seats: template.bodyType === "SUV" && random() > 0.75 ? 7 : 5,
      powerHp: template.powerHp,
      powerKw: template.powerKw,
      emptyWeightKg: randomInt(random, 1320, 2240),
      towingCapacityBrakedKg: randomInt(random, 1200, 2200),
      lengthMm: randomInt(random, 4200, 4900),
      widthMm: randomInt(random, 1760, 1970),
      heightMm: randomInt(random, 1420, 1740),
      typeApprovalNumber: strongDraft ? `1${template.make.slice(0, 2).toUpperCase()}${randomInt(random, 100, 999)}` : "",
      vehicleIdentificationNumber: strongDraft ? `VIN${Math.abs(hashSeed(seed)).toString(36).toUpperCase()}123456` : "",
      serialNumber: strongDraft ? `AS24-${randomInt(random, 1000, 9999)}` : "",
      vehicleNumber: strongDraft ? `ZH-${year}-${randomInt(random, 1000, 9999)}` : "",
      energyLabel: pick(["A", "B", "C", "D", "E"], random),
    },
    batteryData: /electric/i.test(template.fuelType)
      ? {
          rangeKm: strongDraft ? randomInt(random, 320, 560) : undefined,
          batteryCapacityKWh: strongDraft ? randomInt(random, 50, 85) : undefined,
          batteryOwnershipModel: strongDraft ? "Included in purchase price" : "",
          batteryHealthPercent: strongDraft ? randomInt(random, 88, 98) : undefined,
          hasBatteryHealthCertificate: strongDraft,
          chargingPlugAc: "Type 2",
          chargingPowerAcKw: strongDraft ? 11 : undefined,
          chargingTimeAcMinutes: strongDraft ? randomInt(random, 280, 520) : undefined,
          chargingPlugDc: strongDraft ? "CCS" : "",
          chargingPowerDcKw: strongDraft ? randomInt(random, 80, 250) : undefined,
          chargingTimeDcMinutes: strongDraft ? randomInt(random, 22, 45) : undefined,
          chargingCableIncluded: strongDraft,
        }
      : {},
    sellerNotes: pick(cantonNotes, random),
  };
}

export function generateMockListings(count: number, seedPrefix = "listing-doctor-demo") {
  return Array.from({ length: count }, (_, index) => generateMockListing(`${seedPrefix}-${index + 1}`));
}

function createSeededRandom(seed: string) {
  let state = Math.abs(hashSeed(seed)) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function pickMany(items: string[], count: number, random: () => number) {
  const offset = randomInt(random, 0, items.length - 1);
  return Array.from({ length: count }, (_, index) => items[(offset + index) % items.length] ?? "").filter(
    Boolean,
  );
}

function buildUploadedImages(photoChecklist: ListingDraft["photoChecklist"], targetCount: number) {
  const taggedImages = Object.entries(photoChecklist)
    .filter(([, value]) => value)
    .map(([coverage], index) => ({
      id: `mock-image-${index + 1}`,
      name: `${coverage}.jpg`,
      coverage: coverage as keyof ListingDraft["photoChecklist"],
    }));

  return [
    ...taggedImages,
    ...Array.from({ length: Math.max(0, targetCount - taggedImages.length) }, (_, index) => ({
      id: `mock-image-extra-${index + 1}`,
      name: `detail-${index + 1}.jpg`,
      coverage: "other" as const,
    })),
  ];
}

function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
