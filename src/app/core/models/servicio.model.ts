export type CategoriaServicio = 'CORTE' | 'COLOR' | 'TRATAMIENTO' | 'BARBERIA' | 'OTRO';

export const CATEGORIAS_SERVICIO: Record<CategoriaServicio, string> = {
  CORTE: 'Corte',
  COLOR: 'Color',
  TRATAMIENTO: 'Tratamiento',
  BARBERIA: 'Barbería',
  OTRO: 'Otro',
};

export const CATEGORIAS_LIST: CategoriaServicio[] = [
  'CORTE',
  'COLOR',
  'TRATAMIENTO',
  'BARBERIA',
  'OTRO',
];

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionMin: number;
  precio: number;
  categoria: CategoriaServicio;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicioDto {
  nombre: string;
  descripcion?: string | null;
  duracionMin: number;
  precio: number;
  categoria: CategoriaServicio;
  activo?: boolean;
}