"use client";

import { useEffect, useMemo, useState } from "react";

import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { Label } from "@/components/ui/label";
import {
  fetchLocationCities,
  fetchLocationCountries,
  fetchLocationStates,
  namesToOptions,
} from "@/lib/location-api";

export function LocationFormFields({
  open,
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingCountries(true);
    fetchLocationCountries()
      .then((rows) => {
        if (!cancelled) setCountries(rows);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !country) {
      setStates([]);
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingStates(true);
    fetchLocationStates(country)
      .then((rows) => {
        if (!cancelled) setStates(rows);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, country]);

  useEffect(() => {
    if (!open || !country || !state) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetchLocationCities(country, state)
      .then((rows) => {
        if (!cancelled) setCities(rows);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, country, state]);

  function withCurrent(options, current) {
    const value = String(current || "").trim();
    if (!value) return options;
    if (options.some((row) => row.value === value)) return options;
    return [{ value, label: value }, ...options];
  }

  const countryOptions = useMemo(
    () => withCurrent(namesToOptions(countries), country),
    [countries, country]
  );
  const stateOptions = useMemo(
    () => withCurrent(namesToOptions(states), state),
    [states, state]
  );
  const cityOptions = useMemo(
    () => withCurrent(namesToOptions(cities), city),
    [cities, city]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="min-w-0">
        <Label htmlFor="co-country">Country</Label>
        <FormFieldDropdown
          id="co-country"
          value={country || ""}
          onChange={(value) => onCountryChange(value ?? "")}
          options={countryOptions}
          placeholder={
            loadingCountries ? "Loading countries…" : "Select country"
          }
          searchable
          searchPlaceholder="Search countries…"
          emptyLabel={
            loadingCountries ? "Loading…" : "No countries found"
          }
          listClassName="min-h-48"
          disabled={loadingCountries}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="co-state">State / Region</Label>
          <FormFieldDropdown
            id="co-state"
            value={state || ""}
            onChange={(value) => onStateChange(value ?? "")}
            options={stateOptions}
            placeholder={
              !country
                ? "Select country first"
                : loadingStates
                  ? "Loading…"
                  : "Select state"
            }
            searchable
            searchPlaceholder="Search states…"
            emptyLabel={
              !country
                ? "Choose a country"
                : loadingStates
                  ? "Loading…"
                  : "No states found"
            }
            listClassName="min-h-40"
            disabled={!country || loadingStates}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="co-city">City</Label>
          <FormFieldDropdown
            id="co-city"
            value={city || ""}
            onChange={(value) => onCityChange(value ?? "")}
            options={cityOptions}
            placeholder={
              !state
                ? "Select state first"
                : loadingCities
                  ? "Loading…"
                  : "Select city"
            }
            searchable
            searchPlaceholder="Search cities…"
            emptyLabel={
              !state
                ? "Choose a state"
                : loadingCities
                  ? "Loading…"
                  : "No cities found"
            }
            listClassName="min-h-40"
            disabled={!country || !state || loadingCities}
          />
        </div>
      </div>
    </div>
  );
}
