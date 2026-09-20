export interface Cliente {
  id: number;
  usuarioId: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaNacimiento: string | null;
  notas: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearClienteDto {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaNacimiento?: string | null;
  notas?: string | null;
}