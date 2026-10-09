"use client";

import { Input, Select } from "@/components/ui/Field";

export interface VenueOption {
  id: string;
  name: string;
}

export interface LocationValue {
  clubVenueId: string | null;
  locationLabel: string | null;
}

const OTHER = "__autre__";

/**
 * Lieu d'un entraînement : un gymnase du club (liste réelle du club, jamais
 * codée en dur) ou un lieu libre (« Autre lieu… »). Liste vide = saisie libre.
 */
export function LocationPicker({ venues, value, onChange, idPrefix }: { venues: VenueOption[]; value: LocationValue; onChange: (value: LocationValue) => void; idPrefix: string }) {
  const free = value.clubVenueId === null;
  if (venues.length === 0) {
    return <Input id={`${idPrefix}-label`} aria-label="Lieu" placeholder="Gymnase, salle…" value={value.locationLabel ?? ""} maxLength={120} onChange={(e) => onChange({ clubVenueId: null, locationLabel: e.target.value || null })} />;
  }
  return (
    <div className="flex flex-col gap-2">
      <Select
        id={`${idPrefix}-venue`}
        aria-label="Lieu"
        value={free ? OTHER : (value.clubVenueId ?? OTHER)}
        onChange={(e) => (e.target.value === OTHER ? onChange({ clubVenueId: null, locationLabel: value.locationLabel }) : onChange({ clubVenueId: e.target.value, locationLabel: null }))}
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
        <option value={OTHER}>Autre lieu…</option>
      </Select>
      {free ? <Input id={`${idPrefix}-label`} aria-label="Autre lieu" placeholder="Nom du lieu" value={value.locationLabel ?? ""} maxLength={120} onChange={(e) => onChange({ clubVenueId: null, locationLabel: e.target.value || null })} /> : null}
    </div>
  );
}

/** Corps API : un gymnase OU un libellé (jamais les deux). */
export function locationBody(value: LocationValue): { clubVenueId: string | null; locationLabel: string | null } {
  return value.clubVenueId ? { clubVenueId: value.clubVenueId, locationLabel: null } : { clubVenueId: null, locationLabel: value.locationLabel?.trim() || null };
}
