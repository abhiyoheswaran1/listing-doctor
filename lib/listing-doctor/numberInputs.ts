export function requiredNumberInputValue(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? String(value)
    : "";
}

export function parseRequiredNumberInputValue(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
