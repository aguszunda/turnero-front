export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'CLIENTE';

export const ROLES: Record<Rol, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  PROFESIONAL: 'Profesional',
  CLIENTE: 'Cliente',
};

export const ROLES_LIST: Rol[] = ['ADMIN', 'RECEPCIONISTA', 'PROFESIONAL', 'CLIENTE'];

export interface Usuario {
  id: number;
  email: string;
  /** Solo presente al crear/editar; el backend nunca lo expone en listas. */
  passwordHash?: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Credenciales {
  email: string;
  password: string;
}

export interface UsuarioLogueado {
  id: number;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  profesionalId?: number;
  clienteId?: number;
}

export interface TokenResponse {
  token: string;
  usuario: UsuarioLogueado;
}