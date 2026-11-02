import { apiFetch } from "@/lib/api";

export const COUNTRIES_DEV_URL = "https://countries.dev/countries";

export const FALLBACK_PHONE_COUNTRIES = [
  { id: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { id: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { id: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { id: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { id: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
];

function dialCodeFrom(value) {
  const code = String(value ?? "").trim();
  if (!code || code === "0") return null;
  return code.startsWith("+") ? code : `+${code}`;
}

export function mapCountriesDevPayload(rows) {
  if (!Array.isArray(rows)) return [];

  const countries = rows
    .map((row) => {
      const id = String(row?.alpha2Code || row?.iso2 || "")
        .trim()
        .toUpperCase();
      const name = String(row?.name || "").trim();
      const codes = Array.isArray(row?.callingCodes) ? row.callingCodes : [];
      let dialCode = null;
      for (const code of codes) {
        dialCode = dialCodeFrom(code);
        if (dialCode) break;
      }
      if (!dialCode && row?.phonecode != null) {
        dialCode = dialCodeFrom(row.phonecode);
      }
      const flag = String(row?.flag || row?.emoji || "").trim() || "🏳️";
      if (!id || !name || !dialCode) return null;
      return { id, name, dialCode, flag };
    })
    .filter(Boolean);

  return countries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

async function fetchFromCountriesDev() {
  const response = await fetch(COUNTRIES_DEV_URL);
  if (!response.ok) {
    throw new Error(`countries.dev request failed (${response.status})`);
  }
  const rows = await response.json();
  const mapped = mapCountriesDevPayload(rows);
  if (mapped.length === 0) {
    throw new Error("countries.dev returned no dialable countries");
  }
  return mapped;
}

let cachedCountries = null;
let countriesPromise = null;

export async function fetchPhoneCountries() {
  if (cachedCountries?.length) return cachedCountries;
  if (!countriesPromise) {
    countriesPromise = apiFetch("/api/countries")
      .then((response) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        if (list.length >= 100) return list;
        return fetchFromCountriesDev();
      })
      .catch(() => fetchFromCountriesDev())
      .catch(() => [...FALLBACK_PHONE_COUNTRIES])
      .then((list) => {
        cachedCountries = list;
        return list;
      })
      .finally(() => {
        countriesPromise = null;
      });
  }
  return countriesPromise;
}
