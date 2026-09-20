export type EstadoTurno =
  | 'pendiente'
  | 'reservado'
  | 'en_curso'
  | 'completado'
  | 'cancelado'
  | 'no_asistio';

export type CreadoPor = 'CLIENTE' | 'RECEPCIONISTA' | 'ADMIN' | 'PROFESIONAL';

export const ESTADOS_TURNO: Record<EstadoTurno, string> = {
  pendiente: 'Pendiente',
  reservado: 'Reservado',
  en_curso: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  no_asistio: 'No asistió',
};

export const ESTADOS_TURNO_LIST: EstadoTurno[] = [
  'pendiente',
  'reservado',
  'en_curso',
  'completado',
  'cancelado',
  'no_asistio',
];

/** Paleta de los estados, mapeada a tokens de color de Material. */
export const ESTADOS_TURNO_COLOR: Record<EstadoTurno, string> = {
  pendiente: '#f59e0b',
  reservado: '#3b82f6',
  en_curso: '#8b5cf6',
  completado: '#10b981',
  cancelado: '#ef4444',
  no_asistio: '#6b7280',
};

export interface Turno {
  id: number;
  codigo: string;
  clienteId: number;
  profesionalId: number;
  servicioId: number;
  /** ISO 8601 (TIMESTAMPTZ). */
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoTurno;
  precioAplicado: number;
  observaciones: string | null;
  motivoCancelacion: string | null;
  creadoPor: CreadoPor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTurnoDto {
  clienteId: number;
  profesionalId: number;
  servicioId: number;
  fechaHoraInicio: string;
  estado?: EstadoTurno;
  observaciones?: string | null;
  creadoPor?: CreadoPor;
}

export interface ReprogramarTurnoDto {
  clienteId: number;
  profesionalId: number;
  servicioId: number;
  fechaHoraInicio: string;
}

export interface CancelarTurnoDto {
  motivo: string;
}

/** Turno expandido con datos de lectura para listas (join de tablas). */
export interface TurnoDetalle extends Turno {
  servicioNombre: string;
  profesionalNombre: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
}