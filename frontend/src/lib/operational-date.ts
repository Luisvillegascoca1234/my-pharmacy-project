export const OPERATIONAL_TIME_ZONE = "America/La_Paz";

const operationalDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: OPERATIONAL_TIME_ZONE,
  year: "numeric"
});

export function getOperationalDate(date = new Date()) {
  const parts = operationalDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not resolve the operational date.");
  }

  return `${year}-${month}-${day}`;
}
