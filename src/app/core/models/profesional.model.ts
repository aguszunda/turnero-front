import type { Servicio } from './servicio.model';

export interface Profesional {
  id: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  especialidad: string | null;
  bio: string | null;
  activo: boolean;
  /** Servicios que presta (relación N:M). */
  servicios: Servicio[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfesionalDto {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  especialidad?: string | null;
  bio?: string | null;
  activo?: boolean;
  servicioIds: number[];
}

export interface UpdateProfesionalDto extends Partial<CreateProfesionalDto> {
  id: number;
}