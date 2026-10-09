"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, FormMessage, Input, Select } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { TrainingSeriesDto } from "@/lib/api/teamLife";
import { LocationPicker, locationBody, type LocationValue, type VenueOption } from "./LocationPicker";
import { formatDateKey, WEEKDAY_ORDER, WEEKDAYS } from "./labels";
import type { TeamLifeClient } from "./team-life-client";

interface SlotDraft {
  key: number;
  weekday: number;
  startTime: string;
  endTime: string;
  location: LocationValue;
}

/**
 * « Planifier les entraînements » : toute la semaine d'une équipe en un
 * seul écran (un créneau par ligne, « + Ajouter un créneau », Enregistrer)
 * — les séances de toute la période sont générées côté serveur, à l'heure
 * locale du club (19:00 reste 19:00 au passage à l'heure d'hiver).
 */
export function TrainingPlannerSheet({
  open,
  onClose,
  client,
  teamId,
  teamName,
  venues,
  today,
  seasonEnd,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  client: TeamLifeClient;
  teamId: string;
  teamName: string;
  venues: VenueOption[];
  today: string;
  seasonEnd: string;
  onSaved: (series: TrainingSeriesDto[]) => void;
}) {
  const defaultLocation: LocationValue = venues[0] ? { clubVenueId: venues[0].id, locationLabel: null } : { clubVenueId: null, locationLabel: null };
  const [slots, setSlots] = useState<SlotDraft[]>([{ key: 1, weekday: 2, startTime: "18:00", endTime: "19:30", location: defaultLocation }]);
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(seasonEnd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: number, patch: Partial<SlotDraft>) => setSlots((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addSlot = () =>
    setSlots((all) => {
      const last = all[all.length - 1];
      // Nouveau créneau : même horaire et même lieu, deux jours plus tard (cas le plus courant : mardi + jeudi).
      return [...all, { key: Math.max(0, ...all.map((s) => s.key)) + 1, weekday: last ? (last.weekday + 2) % 7 : 2, startTime: last?.startTime ?? "18:00", endTime: last?.endTime ?? "19:30", location: last?.location ?? defaultLocation }];
    });

  async function save() {
    setError(null);
    const invalid = slots.find((s) => s.endTime <= s.startTime);
    if (invalid) return setError(`${WEEKDAYS[invalid.weekday]} : l'heure de fin doit être après l'heure de début.`);
    if (endsOn < startsOn) return setError("La date de fin doit être après la date de début.");
    setSaving(true);
    try {
      const result = await client.createSeries(teamId, { startsOn, endsOn, slots: slots.map((s) => ({ weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, ...locationBody(s.location) })) });
      onSaved(result.series);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Planifier les entraînements"
      description={`${teamName} — chaque créneau se répète toutes les semaines jusqu'au ${formatDateKey(endsOn)}.`}
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
      <div className="flex flex-col gap-5">
        <ol className="flex flex-col gap-3">
          {slots.map((slot, index) => (
            <li key={slot.key} className="flex flex-col gap-3 rounded-[16px] border border-border bg-surface-raised p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-muted">Créneau {index + 1}</p>
                {slots.length > 1 ? (
                  <IconButton label={`Retirer le créneau ${index + 1}`} size="sm" variant="ghost" onClick={() => setSlots((all) => all.filter((s) => s.key !== slot.key))}>
                    <Trash2 />
                  </IconButton>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="col-span-2 sm:col-span-1">
                <Select aria-label={`Jour du créneau ${index + 1}`} value={slot.weekday} onChange={(e) => update(slot.key, { weekday: Number(e.target.value) })}>
                  {WEEKDAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {WEEKDAYS[d]}
                    </option>
                  ))}
                </Select>
                </div>
                <Input type="time" aria-label={`Début du créneau ${index + 1}`} value={slot.startTime} step={300} onChange={(e) => update(slot.key, { startTime: e.target.value })} />
                <Input type="time" aria-label={`Fin du créneau ${index + 1}`} value={slot.endTime} step={300} onChange={(e) => update(slot.key, { endTime: e.target.value })} />
              </div>
              <LocationPicker idPrefix={`slot-${slot.key}`} venues={venues} value={slot.location} onChange={(location) => update(slot.key, { location })} />
            </li>
          ))}
        </ol>
        {slots.length < 7 ? (
          <Button variant="outline" icon={<Plus />} onClick={addSlot} className="self-start">
            Ajouter un créneau
          </Button>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="À partir du">{(props) => <Input type="date" {...props} value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />}</Field>
          <Field label="Jusqu'au">{(props) => <Input type="date" {...props} value={endsOn} min={startsOn} onChange={(e) => setEndsOn(e.target.value)} />}</Field>
        </div>
        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      </div>
    </Sheet>
  );
}
