/** Plantilla de horario laboral semanal por profesional. diaSemana: 0 = domingo .. 6 = sábado. */
export interface HorarioSemanal {
  id: number;
  profesionalId: number;
  /** 0 (domingo) a 6 (sábado). */
  diaSemana: number;
  /** Formato "HH:mm" (24h). */
  horaInicio: string;
  horaFin: string;
  inicioDescanso: string | null;
  finDescanso: string | null;
  /** Margen de limpieza/preparación entre turnos (min). */
  margenMin: number;
}

export interface CreateHorarioDto {
  profesionalId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  inicioDescanso?: string | null;
  finDescanso?: string | null;
  margenMin?: number;
}