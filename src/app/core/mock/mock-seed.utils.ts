/** Clave de fecha "YYYY-MM-DD" sumando días a hoy (zona local). */
export function agregarDiasKey(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO de hoy sumando horas (para createdAt/updatedAt). */
export function hoyMasHorasIso(horas: number): string {
  return new Date(Date.now() + horas * 3_600_000).toISOString();
}