/** Utilidades de tiempo: la UI trabaja en hora local y serializa ISO (UTC) como el API. */

const DAY_MS = 86_400_000;

/** "HH:mm" -> minutos desde las 00:00. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** minutos desde las 00:00 -> "HH:mm" (24h). */
export function minutesToTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Fecha local -> clave "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Clave "YYYY-MM-DD" -> Date local a las 00:00. */
export function dateKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Minutos locales del día de un Date. */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Combina fecha local + hora "HH:mm" y serializa como ISO (UTC). */
export function isoFromLocal(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}

/** ISO string -> Date local. */
export function parseIso(iso: string): Date {
  return new Date(iso);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function dateFallsOn(date: Date, dateKey: string): boolean {
  return toDateKey(date) === dateKey;
}

/** True si el turno [start, end) se superpone con [otherStart, otherEnd). */
export function overlaps(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
): boolean {
  return start < otherEnd && end > otherStart;
}

export function diferenciaDias(fechaDesde: string, fechaHasta: string): number {
  const desde = dateKeyToDate(fechaDesde).getTime();
  const hasta = dateKeyToDate(fechaHasta).getTime();
  return Math.round((hasta - desde) / DAY_MS);
}

/** Observa si un ISO cae dentro de un bloqueo por fecha (rango inclusive). */
export function isoInBloqueo(iso: string, fechaDesde: string, fechaHasta: string): boolean {
  return rangeInDates(fechaDesde, fechaHasta, toDateKey(parseIso(iso)));
}

export function rangeInDates(rDesde: string, rHasta: string, fecha: string): boolean {
  return fecha >= rDesde && fecha <= rHasta;
}