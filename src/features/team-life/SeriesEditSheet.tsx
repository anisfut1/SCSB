"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, Input, Select } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { TrainingSeriesDto } from "@/lib/api/teamLife";
import { LocationPicker, locationBody, type LocationValue, type VenueOption } from "./LocationPicker";
import { seriesLabel, WEEKDAY_ORDER, WEEKDAYS } from "./labels";
import type { TeamLifeClient } from "./team-life-client";

/**
 * Modifier un créneau À PARTIR D'UNE DATE : les séances d'avant ne bougent
 * jamais (ni celles déjà modifiées à la main) ; les réponses déjà données
 * suivent la séance quand le jour ne change pas.
 */
export function SeriesEditSheet({ series, onClose, client, venues, today, onSaved }: { series: TrainingSeriesDto; onClose: () => void; client: TeamLifeClient; venues: VenueOption[]; today: string; onSaved: () => void }) {
  const [fromDate, setFromDate] = useState(today > series.startsOn ? today : series.startsOn);
  const [weekday, setWeekday] = useState(series.weekday);
  const [startTime, setStartTime] = useState(series.startTime);
  const [endTime, setEndTime] = useState(series.endTime);
  const [endsOn, setEndsOn] = useState(series.endsOn);
  const [location, setLocation] = useState<LocationValue>({ clubVenueId: series.location.clubVenueId, locationLabel: series.location.clubVenueId ? null : series.location.label });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (endTime <= startTime) return setError("L'heure de fin doit être après l'heure de début.");
    setSaving(true);
    try {
      await client.updateSeries(series.id, { fromDate, weekday, startTime, endTime, endsOn, ...locationBody(location) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Modifier le créneau"
      description={`${seriesLabel(series)} — les séances avant la date choisie restent inchangées.`}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="À partir du" hint="Première séance concernée par le changement.">
          {(props) => <Input type="date" {...props} value={fromDate} min={today} onChange={(e) => setFromDate(e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="col-span-2 sm:col-span-1">
                <Select aria-label="Jour" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {WEEKDAYS[d]}
              </option>
            ))}
          </Select>
                </div>
          <Input type="time" aria-label="Début" value={startTime} step={300} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" aria-label="Fin" value={endTime} step={300} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <LocationPicker idPrefix={`series-${series.id}`} venues={venues} value={location} onChange={setLocation} />
        <Field label="Jusqu'au">{(props) => <Input type="date" {...props} value={endsOn} min={fromDate} onChange={(e) => setEndsOn(e.target.value)} />}</Field>
        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      </div>
    </Sheet>
  );
}
