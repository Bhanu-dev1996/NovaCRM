import { apiFetch } from "@/lib/api";

export async function fetchLocationCountries() {
  const response = await apiFetch("/api/location/countries");
  return response.data || [];
}

export async function fetchLocationStates(country) {
  const name = String(country || "").trim();
  if (!name) return [];
  const response = await apiFetch(
    `/api/location/states?country=${encodeURIComponent(name)}`
  );
  return response.data || [];
}

export async function fetchLocationCities(country, state) {
  const countryName = String(country || "").trim();
  const stateName = String(state || "").trim();
  if (!countryName || !stateName) return [];
  const params = new URLSearchParams({
    country: countryName,
    state: stateName,
  });
  const response = await apiFetch(`/api/location/cities?${params.toString()}`);
  return response.data || [];
}

export function namesToOptions(names) {
  return (names || []).map((label) => ({
    value: label,
    label,
  }));
}
