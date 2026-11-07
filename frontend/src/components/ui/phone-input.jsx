"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FALLBACK_PHONE_COUNTRIES,
  fetchPhoneCountries,
} from "@/lib/phone-countries";
import { cn } from "@/lib/utils";

const DEFAULT_COUNTRY_ID = "US";

function buildDialPrefixes(countries) {
  return [...countries]
    .reduce((acc, country) => {
      if (!acc.some((item) => item.dialCode === country.dialCode)) {
        acc.push({ dialCode: country.dialCode, countryId: country.id });
      }
      return acc;
    }, [])
    .sort((a, b) => b.dialCode.length - a.dialCode.length);
}

function countryMap(countries) {
  return Object.fromEntries(countries.map((country) => [country.id, country]));
}

export function getPhoneCountry(countries, countryId) {
  const map = countryMap(countries);
  return map[countryId] || map[DEFAULT_COUNTRY_ID] || countries[0];
}

export function parsePhoneValue(value, countries) {
  const list = countries?.length ? countries : FALLBACK_PHONE_COUNTRIES;
  const dialPrefixes = buildDialPrefixes(list);
  const raw = String(value || "").trim();
  if (!raw) {
    return { countryId: DEFAULT_COUNTRY_ID, nationalDigits: "" };
  }

  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && digits) {
    for (const prefix of dialPrefixes) {
      const codeDigits = prefix.dialCode.slice(1);
      if (digits.startsWith(codeDigits)) {
        return {
          countryId: prefix.countryId,
          nationalDigits: digits.slice(codeDigits.length),
        };
      }
    }
  }

  return {
    countryId: DEFAULT_COUNTRY_ID,
    nationalDigits: digits,
  };
}

function formatNationalDigits(digits, country) {
  if (!digits) return "";
  if (country.dialCode === "+1" && digits.length <= 10) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (country.dialCode === "+91" && digits.length <= 10) {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function buildPhoneValue(countries, countryId, nationalDigits) {
  const country = getPhoneCountry(countries, countryId);
  const digits = String(nationalDigits || "").replace(/\D/g, "");
  if (!digits) return "";
  const formatted = formatNationalDigits(digits, country);
  return `${country.dialCode} ${formatted}`.trim();
}

function usePhoneCountries() {
  const [countries, setCountries] = useState(FALLBACK_PHONE_COUNTRIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPhoneCountries().then((list) => {
      if (!cancelled) setCountries(list);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, loading };
}

function CountryCodeSelect({
  countries,
  countryId,
  onCountryChange,
  disabled,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = getPhoneCountry(countries, countryId);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(q) ||
        country.dialCode.includes(q) ||
        country.id.toLowerCase().includes(q)
    );
  }, [countries, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || loading}
        render={
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || loading}
            className="h-full shrink-0 rounded-none border-0 px-2.5 shadow-none hover:bg-muted/60 dark:hover:bg-input/50"
            aria-label={`Country code ${selected.dialCode}`}
          />
        }
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-[13px] font-medium text-foreground tabular-nums">
            {selected.dialCode}
          </span>
        )}
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        positionMethod="fixed"
        collisionAvoidance={{
          side: "none",
          align: "none",
          fallbackAxisSide: "none",
        }}
        className="z-[120] flex max-h-[min(24rem,70vh)] w-[min(300px,calc(100vw-2rem))] min-w-[min(300px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden rounded-xl p-0"
      >
        <div className="shrink-0 border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${countries.length} countries…`}
            className="h-9"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (filtered[0]) {
                  onCountryChange(filtered[0].id);
                  setOpen(false);
                  setQuery("");
                }
              }
            }}
          />
        </div>
        <div className="max-h-64 min-h-48 overflow-y-auto overscroll-contain p-1 [scrollbar-gutter:stable]">
          {filtered.map((country) => (
            <button
              key={country.id}
              type="button"
              onClick={() => {
                onCountryChange(country.id);
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                countryId === country.id && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  countryId === country.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="text-base leading-none" aria-hidden="true">
                {country.flag}
              </span>
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {country.dialCode}
              </span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              No countries found
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  className,
  placeholder,
  disabled = false,
}) {
  const { countries, loading } = usePhoneCountries();
  const parsed = parsePhoneValue(value, countries);
  const country = getPhoneCountry(countries, parsed.countryId);
  const displayNational = formatNationalDigits(parsed.nationalDigits, country);

  function updateCountry(nextCountryId) {
    onChange(buildPhoneValue(countries, nextCountryId, parsed.nationalDigits));
  }

  function updateNational(nextValue) {
    const digits = nextValue.replace(/\D/g, "").slice(0, 15);
    onChange(buildPhoneValue(countries, parsed.countryId, digits));
  }

  const nationalPlaceholder =
    placeholder ||
    (country.dialCode === "+1"
      ? "(415) 555-0142"
      : country.dialCode === "+91"
        ? "98765 43210"
        : "Phone number");

  return (
    <div
      className={cn(
        "flex h-10 overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <div className="flex shrink-0 items-center border-r border-input bg-muted/30 dark:bg-input/20">
        <CountryCodeSelect
          countries={countries}
          countryId={parsed.countryId}
          onCountryChange={updateCountry}
          disabled={disabled}
          loading={loading}
        />
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={displayNational}
        onChange={(event) => updateNational(event.target.value)}
        onBlur={onBlur}
        placeholder={nationalPlaceholder}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-[13px] font-normal outline-none placeholder:text-muted-foreground"
        aria-label="Phone number"
      />
    </div>
  );
}
