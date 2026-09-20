/** Período donde el profesional no atiende (vacaciones, permiso, etc.). */
export interface Bloqueo {
  id: number;
  profesionalId: number;
  /** Fecha "YYYY-MM-DD" (inclusive). */
  fechaDesde: string;
  fechaHasta: string;
  todoElDia: boolean;
  motivo: string | null;
}

export interface CreateBloqueoDto {
  profesionalId: number;
  fechaDesde: string;
  fechaHasta: string;
  todoElDia?: boolean;
  motivo?: string | null;
}