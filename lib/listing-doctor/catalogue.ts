export type CatalogueDate = {
  month: string;
  year: number;
};

export type CatalogueVersion = {
  name: string;
  productionStart: CatalogueDate;
  productionEnd: CatalogueDate;
  fuelType: string;
  transmission: string;
  bodyType: string;
};

export type CatalogueModel = {
  make: string;
  model: string;
  productionStart: CatalogueDate;
  productionEnd: CatalogueDate;
  versions: CatalogueVersion[];
};

export const monthNames = [
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

export const vehicleCatalogue: CatalogueModel[] = [
  {
    make: "BMW",
    model: "320d Touring",
    productionStart: { month: "March", year: 2015 },
    productionEnd: { month: "August", year: 2019 },
    versions: [
      version("xDrive Steptronic", "March", 2015, "August", 2019, "Diesel", "Automatic", "Estate"),
      version("Sport Line", "March", 2015, "August", 2019, "Diesel", "Automatic", "Estate"),
      version("Luxury Line", "September", 2015, "August", 2019, "Diesel", "Automatic", "Estate"),
    ],
  },
  {
    make: "Toyota",
    model: "RAV4 Hybrid",
    productionStart: { month: "January", year: 2019 },
    productionEnd: { month: "December", year: 2024 },
    versions: [
      version("Premium AWD", "January", 2019, "December", 2024, "Hybrid", "Automatic", "SUV"),
      version("Style AWD", "January", 2019, "December", 2024, "Hybrid", "Automatic", "SUV"),
      version("Trend 4x4", "January", 2019, "June", 2022, "Hybrid", "Automatic", "SUV"),
    ],
  },
  {
    make: "Volkswagen",
    model: "Golf 1.4 TSI",
    productionStart: { month: "January", year: 2012 },
    productionEnd: { month: "June", year: 2019 },
    versions: [
      version("Comfortline", "January", 2012, "June", 2019, "Petrol", "Manual", "Hatchback"),
      version("Highline", "January", 2012, "June", 2019, "Petrol", "Manual", "Hatchback"),
      version("Trendline", "January", 2012, "December", 2017, "Petrol", "Manual", "Hatchback"),
    ],
  },
  {
    make: "Tesla",
    model: "Model Y",
    productionStart: { month: "January", year: 2021 },
    productionEnd: { month: "December", year: 2026 },
    versions: [
      version("Long Range AWD", "January", 2021, "December", 2026, "Electric", "Automatic", "SUV"),
      version("Performance", "March", 2021, "December", 2026, "Electric", "Automatic", "SUV"),
      version("RWD", "August", 2022, "December", 2026, "Electric", "Automatic", "SUV"),
    ],
  },
  {
    make: "Audi",
    model: "A4 Avant 40 TDI",
    productionStart: { month: "September", year: 2018 },
    productionEnd: { month: "October", year: 2024 },
    versions: [
      version("S line quattro", "September", 2018, "October", 2024, "Diesel", "Automatic", "Estate"),
      version("Advanced", "September", 2018, "October", 2024, "Diesel", "Automatic", "Estate"),
      version("Sport", "September", 2018, "December", 2021, "Diesel", "Automatic", "Estate"),
    ],
  },
  {
    make: "Mercedes-Benz",
    model: "GLC 300e 4MATIC",
    productionStart: { month: "January", year: 2020 },
    productionEnd: { month: "December", year: 2026 },
    versions: [
      version("AMG Line", "January", 2020, "December", 2026, "Plug-in hybrid", "Automatic", "SUV"),
      version("Avantgarde", "January", 2020, "December", 2026, "Plug-in hybrid", "Automatic", "SUV"),
      version("Swiss Star", "March", 2021, "December", 2025, "Plug-in hybrid", "Automatic", "SUV"),
    ],
  },
  {
    make: "Skoda",
    model: "Octavia Combi 2.0 TDI",
    productionStart: { month: "January", year: 2017 },
    productionEnd: { month: "December", year: 2024 },
    versions: [
      version("Style DSG", "January", 2017, "December", 2024, "Diesel", "Automatic", "Estate"),
      version("Ambition", "January", 2017, "December", 2024, "Diesel", "Automatic", "Estate"),
      version("RS", "June", 2018, "December", 2024, "Diesel", "Automatic", "Estate"),
    ],
  },
  {
    make: "Volvo",
    model: "XC60 B5 AWD",
    productionStart: { month: "January", year: 2018 },
    productionEnd: { month: "December", year: 2026 },
    versions: [
      version("Momentum", "January", 2018, "December", 2026, "Petrol mild hybrid", "Automatic", "SUV"),
      version("Inscription", "January", 2018, "December", 2026, "Petrol mild hybrid", "Automatic", "SUV"),
      version("R-Design", "January", 2018, "December", 2023, "Petrol mild hybrid", "Automatic", "SUV"),
    ],
  },
];

export function getCatalogueMakes() {
  return Array.from(new Set(vehicleCatalogue.map((entry) => entry.make))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getCatalogueModels(make: string) {
  return vehicleCatalogue
    .filter((entry) => entry.make === make)
    .map((entry) => entry.model)
    .sort((a, b) => a.localeCompare(b));
}

export function getCatalogueEntry(make: string, model: string) {
  return vehicleCatalogue.find((entry) => entry.make === make && entry.model === model) ?? null;
}

export function getProductionYears(make: string, model: string) {
  const entry = getCatalogueEntry(make, model);
  if (!entry) return [];

  return Array.from(
    { length: entry.productionEnd.year - entry.productionStart.year + 1 },
    (_, index) => entry.productionStart.year + index,
  );
}

export function getProductionMonths(make: string, model: string, year: number) {
  const entry = getCatalogueEntry(make, model);
  if (!entry) return [];

  return monthNames.filter((month) =>
    isWithinRange(
      { month, year },
      entry.productionStart,
      entry.productionEnd,
    ),
  );
}

export function isValidProductionDate(
  make: string,
  model: string,
  month: string,
  year: number,
) {
  return getProductionMonths(make, model, year).includes(month);
}

export function getVersionsForProductionDate(
  make: string,
  model: string,
  month: string,
  year: number,
) {
  const entry = getCatalogueEntry(make, model);
  if (!entry || !isValidProductionDate(make, model, month, year)) return [];

  return entry.versions.filter((item) =>
    isWithinRange({ month, year }, item.productionStart, item.productionEnd),
  );
}

function version(
  name: string,
  startMonth: string,
  startYear: number,
  endMonth: string,
  endYear: number,
  fuelType: string,
  transmission: string,
  bodyType: string,
): CatalogueVersion {
  return {
    name,
    productionStart: { month: startMonth, year: startYear },
    productionEnd: { month: endMonth, year: endYear },
    fuelType,
    transmission,
    bodyType,
  };
}

function isWithinRange(date: CatalogueDate, start: CatalogueDate, end: CatalogueDate) {
  const value = toMonthIndex(date);
  return value >= toMonthIndex(start) && value <= toMonthIndex(end);
}

function toMonthIndex(date: CatalogueDate) {
  const monthIndex = monthNames.indexOf(date.month);
  return date.year * 12 + Math.max(0, monthIndex);
}
