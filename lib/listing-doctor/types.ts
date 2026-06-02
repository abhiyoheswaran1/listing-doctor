export type SellerType = "private" | "dealer";

export type MfkStatus = "valid" | "expired" | "missing" | "unknown";

export type ServiceHistoryStatus = "complete" | "partial" | "unknown" | "missing";

export type AccidentHistoryStatus =
  | "accident-free"
  | "repaired"
  | "unknown"
  | "has-damage";

export type WarrantyStatus =
  | "manufacturer warranty"
  | "dealer warranty"
  | "battery warranty"
  | "none"
  | "unknown";

export type PublishReadiness =
  | "Ready to publish"
  | "Improve before publishing"
  | "High risk, fix first";

export type ImpactLevel = "High" | "Medium" | "Low";

export type PhotoChecklist = {
  frontExterior: boolean;
  rearExterior: boolean;
  leftSide: boolean;
  rightSide: boolean;
  interior: boolean;
  dashboard: boolean;
  odometer: boolean;
  tyres: boolean;
  serviceBook: boolean;
  defectsDamage: boolean;
};

export type PhotoChecklistKey = keyof PhotoChecklist;

export type ImageCoverageKey = PhotoChecklistKey | "other";

export const photoChecklistItems: Array<{
  key: PhotoChecklistKey;
  label: string;
  weight: number;
}> = [
  { key: "frontExterior", label: "Front exterior", weight: 8 },
  { key: "rearExterior", label: "Rear exterior", weight: 8 },
  { key: "leftSide", label: "Left side", weight: 6 },
  { key: "rightSide", label: "Right side", weight: 6 },
  { key: "interior", label: "Interior", weight: 12 },
  { key: "dashboard", label: "Dashboard", weight: 12 },
  { key: "odometer", label: "Odometer", weight: 14 },
  { key: "tyres", label: "Tyres", weight: 10 },
  { key: "serviceBook", label: "Service book", weight: 12 },
  { key: "defectsDamage", label: "Defects or damage", weight: 12 },
];

export type ListingDraft = {
  id: string;
  name: string;
  make: string;
  model: string;
  version?: string;
  year: number;
  productionMonth?: string;
  productionYear?: number;
  firstRegistrationMonth?: string;
  firstRegistrationYear?: number;
  priceChf: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  sellerType: SellerType;
  mfkStatus: MfkStatus;
  serviceHistoryStatus: ServiceHistoryStatus;
  accidentHistoryStatus: AccidentHistoryStatus;
  warrantyStatus: WarrantyStatus;
  exteriorColor?: string;
  interiorColor?: string;
  metallic?: boolean;
  description: string;
  photoCount: number;
  uploadedImages?: UploadedImage[];
  photoChecklist: PhotoChecklist;
  keyFeatures: string[];
  standardEquipment?: string[];
  optionalEquipment?: string[];
  retrofits?: string[];
  technicalData?: TechnicalData;
  batteryData?: BatteryData;
  sellerNotes?: string;
};

export type ScoreSet = {
  overall: number;
  trust: number;
  descriptionQuality: number;
  photoCompleteness: number;
  searchability: number;
  vehicleData?: number;
  equipment?: number;
  technicalData?: number;
  marketPosition?: number;
  batteryData?: number;
};

export type FixRecommendation = {
  title: string;
  detail: string;
  impact: ImpactLevel;
  scoreLift: number;
};

export type PricingFeedback = {
  benchmarkLow: number;
  benchmarkHigh: number;
  averagePrice?: number;
  medianPrice?: number;
  sampleSize?: number;
  benchmarkUniverseSize?: number;
  originalNewPriceEstimate?: number;
  adjustedBenchmarkPrice?: number;
  valuationFactors?: string[];
  deltaPercent?: number;
  position: "below" | "within" | "above";
  concern: string;
};

export type PredictiveConfidence = "High" | "Medium" | "Low";

export type PredictiveInsights = {
  mode: "simulated-ml";
  comparableCount: number;
  benchmarkUniverseSize: number;
  confidence: PredictiveConfidence;
  leadProbabilityScore: number;
  expectedLeadImpact: string;
  leadLiftRange: {
    low: number;
    high: number;
  };
  expectedTimeToFirstContact: string;
  expectedDaysToSell: number;
  priceCompetitiveness: "Strong" | "Neutral" | "Weak";
  descriptionQualityPrediction: "Strong" | "Needs proof" | "Weak";
  photoCoveragePrediction: "Complete" | "Needs proof" | "Incomplete";
  likelyBuyerObjections: string[];
  performanceSignals: string[];
};

export type UploadedImage = {
  id: string;
  name: string;
  coverage: ImageCoverageKey;
  sizeKb?: number;
};

export type TechnicalData = {
  doors?: number;
  seats?: number;
  powerHp?: number;
  powerKw?: number;
  emptyWeightKg?: number;
  towingCapacityBrakedKg?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  typeApprovalNumber?: string;
  vehicleIdentificationNumber?: string;
  serialNumber?: string;
  vehicleNumber?: string;
  energyLabel?: string;
};

export type BatteryData = {
  rangeKm?: number;
  batteryCapacityKWh?: number;
  batteryOwnershipModel?: string;
  batteryHealthPercent?: number;
  hasBatteryHealthCertificate?: boolean;
  chargingPlugAc?: string;
  chargingPowerAcKw?: number;
  chargingTimeAcMinutes?: number;
  chargingPlugDc?: string;
  chargingPowerDcKw?: number;
  chargingTimeDcMinutes?: number;
  chargingCableIncluded?: boolean;
};

export type PastListing = {
  id: string;
  make: string;
  model: string;
  version: string;
  year: number;
  productionMonth: string;
  productionYear: number;
  firstRegistrationMonth: string;
  firstRegistrationYear: number;
  mileageKm: number;
  priceChf: number;
  fuelType: string;
  bodyType: string;
  sellerType: SellerType;
  region: string;
  listingMonth: string;
  seasonalityIndex: number;
  listingAgeDays: number;
  listingAgeBucket: "first-week" | "active" | "aging" | "stale";
  sellerResponseTimeHours: number;
  sellerResponseScore: number;
  dealerCertified: boolean;
  dealerWarrantyIncluded: boolean;
  priceChangeDaysAgo: number;
  standardEquipment: string[];
  optionalEquipment: string[];
  photoCoverageScore: number;
  imageQualityScore: number;
  descriptionQualityScore: number;
  viewCount: number;
  daysToSell: number;
  leadCount: number;
  favoriteCount: number;
  contactRate: number;
  priceReductionCount: number;
  qualityScore: number;
  sold: boolean;
  successful: boolean;
};

export type ScoreBreakdownItem = {
  id: string;
  label: string;
  earned: number;
  possible: number;
  detail: string;
};

export type ListingAnalysis = {
  scores: ScoreSet;
  readiness: PublishReadiness;
  scoreBreakdown: ScoreBreakdownItem[];
  topFixes: FixRecommendation[];
  missingTrustSignals: string[];
  photoImprovements: string[];
  descriptionFeedback: string[];
  searchabilityImprovements: string[];
  pricingFeedback: PricingFeedback;
  pastListingInsights: string[];
  predictiveInsights: PredictiveInsights;
  buyerQuestions: string[];
};

export type ListingReport = ListingAnalysis & {
  improvedTitle: string;
  rewrittenDescription: string;
  finalPrePublishChecklist: string[];
};

export type StructuredDiagnosisResponse = {
  source: "structured";
  listing: ListingDraft;
  diagnosis: ListingReport;
};

export type ApiErrorResponse = {
  error: string;
  details?: string[];
};
