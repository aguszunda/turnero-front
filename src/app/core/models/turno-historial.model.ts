import type { EstadoTurno } from './turno.model';

export interface TurnoHistorial {
  id: number;
  turnoId: number;
  estadoAnterior: EstadoTurno | null;
  estadoNuevo: EstadoTurno;
  usuarioId: number | null;
  fechaCambio: string;
  detalle: string | null;
}