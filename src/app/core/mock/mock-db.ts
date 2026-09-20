import type {
  Bloqueo,
  Cliente,
  HorarioSemanal,
  Profesional,
  Servicio,
  Turno,
  TurnoHistorial,
  Usuario,
  UsuarioLogueado,
} from '@app/core/models';
import { agregarDiasKey, hoyMasHorasIso } from './mock-seed.utils';

const D = (n: number, h = 9, m = 0) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + n);
  fecha.setHours(h, m, 0, 0);
  return fecha.toISOString();
};

function seed(): {
  usuarios: Usuario[];
  clientes: Cliente[];
  profesionales: Profesional[];
  servicios: Servicio[];
  horarios: HorarioSemanal[];
  bloqueos: Bloqueo[];
  turnos: Turno[];
  historial: TurnoHistorial[];
} {
  const servicios: Servicio[] = [
    { id: 1, nombre: 'Corte clásico', descripcion: 'Corte de pelo + secado', duracionMin: 30, precio: 5000, categoria: 'CORTE', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 2, nombre: 'Corte + barba', descripcion: 'Corte de pelo y barba a navaja', duracionMin: 45, precio: 7000, categoria: 'BARBERIA', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 3, nombre: 'Color completo', descripcion: 'Coloración completa con marca premium', duracionMin: 90, precio: 15000, categoria: 'COLOR', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 4, nombre: 'Tratamiento hidratación', descripcion: 'Hidratación profunda de cabello', duracionMin: 60, precio: 9000, categoria: 'TRATAMIENTO', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 5, nombre: 'Peinado', descripcion: 'Peinado para eventos', duracionMin: 30, precio: 4000, categoria: 'OTRO', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 6, nombre: 'Bruñido / keratina', descripcion: 'Alisado progresivo', duracionMin: 120, precio: 20000, categoria: 'TRATAMIENTO', activo: false, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
  ];

  const profesionales: Profesional[] = [
    {
      id: 1, usuarioId: 3, nombre: 'Juan', apellido: 'Pérez', telefono: '+5491100000001', email: 'juan@turnero.com', especialidad: 'Barbería', bio: 'Especialista en corte y barba.', activo: true,
      servicios: [servicios[0], servicios[1]], createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720),
    },
    {
      id: 2, usuarioId: 4, nombre: 'María', apellido: 'López', telefono: '+5491100000002', email: 'maria@turnero.com', especialidad: 'Colorimetría', bio: 'Color y tratamientos capilares.', activo: true,
      servicios: [servicios[0], servicios[2], servicios[3]], createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720),
    },
    {
      id: 3, usuarioId: 5, nombre: 'Carlos', apellido: 'Ruiz', telefono: '+5491100000003', email: 'carlos@turnero.com', especialidad: 'Peinados y tratamientos', bio: 'Peinados creativos.', activo: true,
      servicios: [servicios[3], servicios[4]], createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720),
    },
  ];

  const horarios: HorarioSemanal[] = [
    { id: 1, profesionalId: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', inicioDescanso: '13:00', finDescanso: '14:00', margenMin: 10 },
    { id: 2, profesionalId: 1, diaSemana: 2, horaInicio: '09:00', horaFin: '18:00', inicioDescanso: '13:00', finDescanso: '14:00', margenMin: 10 },
    { id: 3, profesionalId: 1, diaSemana: 3, horaInicio: '09:00', horaFin: '18:00', inicioDescanso: '13:00', finDescanso: '14:00', margenMin: 10 },
    { id: 4, profesionalId: 1, diaSemana: 4, horaInicio: '09:00', horaFin: '18:00', inicioDescanso: '13:00', finDescanso: '14:00', margenMin: 10 },
    { id: 5, profesionalId: 1, diaSemana: 5, horaInicio: '09:00', horaFin: '18:00', inicioDescanso: '13:00', finDescanso: '14:00', margenMin: 10 },
    { id: 6, profesionalId: 1, diaSemana: 6, horaInicio: '10:00', horaFin: '14:00', inicioDescanso: null, finDescanso: null, margenMin: 10 },
    { id: 7, profesionalId: 2, diaSemana: 1, horaInicio: '10:00', horaFin: '19:00', inicioDescanso: '14:00', finDescanso: '15:00', margenMin: 15 },
    { id: 8, profesionalId: 2, diaSemana: 2, horaInicio: '10:00', horaFin: '19:00', inicioDescanso: '14:00', finDescanso: '15:00', margenMin: 15 },
    { id: 9, profesionalId: 2, diaSemana: 3, horaInicio: '10:00', horaFin: '19:00', inicioDescanso: '14:00', finDescanso: '15:00', margenMin: 15 },
    { id: 10, profesionalId: 2, diaSemana: 4, horaInicio: '10:00', horaFin: '19:00', inicioDescanso: '14:00', finDescanso: '15:00', margenMin: 15 },
    { id: 11, profesionalId: 2, diaSemana: 5, horaInicio: '10:00', horaFin: '19:00', inicioDescanso: '14:00', finDescanso: '15:00', margenMin: 15 },
    { id: 12, profesionalId: 3, diaSemana: 1, horaInicio: '11:00', horaFin: '17:00', inicioDescanso: null, finDescanso: null, margenMin: 10 },
    { id: 13, profesionalId: 3, diaSemana: 3, horaInicio: '11:00', horaFin: '17:00', inicioDescanso: null, finDescanso: null, margenMin: 10 },
    { id: 14, profesionalId: 3, diaSemana: 5, horaInicio: '11:00', horaFin: '17:00', inicioDescanso: null, finDescanso: null, margenMin: 10 },
  ];

  const usuarios: Usuario[] = [
    { id: 1, email: 'admin@turnero.com', passwordHash: 'admin123', rol: 'ADMIN', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 2, email: 'recepcion@turnero.com', passwordHash: 'recepcion123', rol: 'RECEPCIONISTA', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 3, email: 'juan@turnero.com', passwordHash: 'prof123', rol: 'PROFESIONAL', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 4, email: 'maria@turnero.com', passwordHash: 'prof123', rol: 'PROFESIONAL', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 5, email: 'carlos@turnero.com', passwordHash: 'prof123', rol: 'PROFESIONAL', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 6, email: 'ana@cliente.com', passwordHash: 'cliente123', rol: 'CLIENTE', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 7, email: 'pedro@cliente.com', passwordHash: 'cliente123', rol: 'CLIENTE', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
  ];

  const clientes: Cliente[] = [
    { id: 1, usuarioId: 6, nombre: 'Ana', apellido: 'García', telefono: '+5491100000004', email: 'ana@cliente.com', fechaNacimiento: '1990-04-12', notas: null, activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
    { id: 2, usuarioId: 7, nombre: 'Pedro', apellido: 'Sosa', telefono: '+5491100000005', email: 'pedro@cliente.com', fechaNacimiento: '1985-11-02', notas: 'Alergia al amoniaco', activo: true, createdAt: hoyMasHorasIso(-720), updatedAt: hoyMasHorasIso(-720) },
  ];

  const turnos: Turno[] = [
    {
      id: 1, codigo: `TN-${agregarDiasKey(0)}-0001`, clienteId: 1, profesionalId: 1, servicioId: 1,
      fechaHoraInicio: D(0, 9, 30), fechaHoraFin: D(0, 10), estado: 'completado', precioAplicado: 5000,
      observaciones: 'Se aplicó cera de acabado', motivoCancelacion: null, creadoPor: 'RECEPCIONISTA', createdAt: hoyMasHorasIso(-48), updatedAt: hoyMasHorasIso(-1),
    },
    {
      id: 2, codigo: `TN-${agregarDiasKey(0)}-0002`, clienteId: 2, profesionalId: 1, servicioId: 2,
      fechaHoraInicio: D(0, 15, 0), fechaHoraFin: D(0, 15, 45), estado: 'reservado', precioAplicado: 7000,
      observaciones: null, motivoCancelacion: null, creadoPor: 'CLIENTE', createdAt: hoyMasHorasIso(-24), updatedAt: hoyMasHorasIso(-24),
    },
    {
      id: 3, codigo: `TN-${agregarDiasKey(0)}-0003`, clienteId: 1, profesionalId: 2, servicioId: 3,
      fechaHoraInicio: D(0, 16, 0), fechaHoraFin: D(0, 17, 30), estado: 'pendiente', precioAplicado: 15000,
      observaciones: null, motivoCancelacion: null, creadoPor: 'CLIENTE', createdAt: hoyMasHorasIso(-6), updatedAt: hoyMasHorasIso(-6),
    },
    {
      id: 4, codigo: `TN-${agregarDiasKey(1)}-0001`, clienteId: 2, profesionalId: 2, servicioId: 3,
      fechaHoraInicio: D(1, 11, 0), fechaHoraFin: D(1, 12, 30), estado: 'reservado', precioAplicado: 15000,
      observaciones: null, motivoCancelacion: null, creadoPor: 'RECEPCIONISTA', createdAt: hoyMasHorasIso(-24), updatedAt: hoyMasHorasIso(-24),
    },
  ];

  const historial: TurnoHistorial[] = [
    { id: 1, turnoId: 1, estadoAnterior: null, estadoNuevo: 'reservado', usuarioId: 2, fechaCambio: hoyMasHorasIso(-48), detalle: 'Creado por recepción' },
    { id: 2, turnoId: 1, estadoAnterior: 'reservado', estadoNuevo: 'en_curso', usuarioId: 3, fechaCambio: D(0, 9, 30), detalle: null },
    { id: 3, turnoId: 1, estadoAnterior: 'en_curso', estadoNuevo: 'completado', usuarioId: 3, fechaCambio: D(0, 10), detalle: 'Servicio finalizado' },
  ];

  return { usuarios, clientes, profesionales, servicios, horarios, bloqueos: [], turnos, historial };
}

const db = seed();

export const usersById = new Map(db.usuarios.map((u) => [u.id, u]));
export const clientesByUsuarioId = new Map(db.clientes.map((c) => [c.usuarioId, c]));

export class MockDatabase {
  usuarios = db.usuarios;
  clientes = db.clientes;
  profesionales = db.profesionales;
  servicios = db.servicios;
  horarios = db.horarios;
  bloqueos = db.bloqueos;
  turnos = db.turnos;
  historial = db.historial;

  private nextId<T extends { id: number }>(list: T[]): number {
    return list.reduce((max, x) => Math.max(max, x.id), 0) + 1;
  }

  private seqPorDia = new Map<string, number>();

  generarCodigo(fechaInicio: string): string {
    const fecha = new Date(fechaInicio);
    const key = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;
    const prev = this.seqPorDia.get(key) ?? this.turnos.filter((t) => t.codigo.includes(key)).length;
    const n = prev + 1;
    this.seqPorDia.set(key, n);
    return `TN-${key}-${String(n).padStart(4, '0')}`;
  }

  getUsuarioLogueado(email: string): UsuarioLogueado | null {
    const u = this.usuarios.find((x) => x.email === email);
    if (!u) return null;
    const c = this.clientes.find((x) => x.usuarioId === u.id);
    const p = this.profesionales.find((x) => x.usuarioId === u.id);
    return {
      id: u.id,
      email: u.email,
      rol: u.rol,
      nombre: c?.nombre ?? p?.nombre ?? '',
      apellido: c?.apellido ?? p?.apellido ?? '',
      clienteId: c?.id,
      profesionalId: p?.id,
    };
  }

  // ---- Servicios ----
  listServicios(): Servicio[] {
    return this.servicios;
  }

  getServicio(id: number): Servicio | undefined {
    return this.servicios.find((s) => s.id === id);
  }

  createServicio(data: Omit<Servicio, 'id' | 'createdAt' | 'updatedAt'>): Servicio {
    const now = hoyMasHorasIso(0);
    const nuevo: Servicio = { ...data, id: this.nextId(this.servicios), createdAt: now, updatedAt: now };
    this.servicios.push(nuevo);
    return nuevo;
  }

  updateServicio(id: number, data: Partial<Servicio>): Servicio | null {
    const s = this.getServicio(id);
    if (!s) return null;
    Object.assign(s, data, { updatedAt: hoyMasHorasIso(0) });
    return s;
  }

  // ---- Profesionales ----
  listProfesionales(): Profesional[] {
    return this.profesionales;
  }

  getProfesional(id: number): Profesional | undefined {
    return this.profesionales.find((p) => p.id === id);
  }

  createProfesional(data: { nombre: string; apellido: string; telefono: string; email: string; especialidad?: string | null; bio?: string | null; activo?: boolean; servicioIds: number[] }): Profesional {
    const now = hoyMasHorasIso(0);
    const nuevo: Profesional = {
      id: this.nextId(this.profesionales),
      usuarioId: null,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      email: data.email,
      especialidad: data.especialidad ?? null,
      bio: data.bio ?? null,
      activo: data.activo ?? true,
      servicios: data.servicioIds.map((id) => this.getServicio(id)!).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    };
    this.profesionales.push(nuevo);
    return nuevo;
  }

  updateProfesional(id: number, data: Record<string, unknown>): Profesional | null {
    const p = this.getProfesional(id);
    if (!p) return null;
    const { servicioIds, ...rest } = data;
    Object.assign(p, rest, { updatedAt: hoyMasHorasIso(0) });
    if (Array.isArray(servicioIds)) {
      p.servicios = (servicioIds as number[]).map((sid) => this.getServicio(+sid)!).filter(Boolean);
    }
    return p;
  }

  // ---- Horarios semanales ----
  listHorarios(profesionalId: number | null = null): HorarioSemanal[] {
    return profesionalId ? this.horarios.filter((h) => h.profesionalId === profesionalId) : this.horarios;
  }

  upsertHorario(data: Omit<HorarioSemanal, 'id'>): HorarioSemanal {
    const existente = this.horarios.find(
      (h) => h.profesionalId === data.profesionalId && h.diaSemana === data.diaSemana,
    );
    if (existente) {
      Object.assign(existente, {
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        inicioDescanso: data.inicioDescanso,
        finDescanso: data.finDescanso,
        margenMin: data.margenMin,
      });
      return existente;
    }
    const nuevo: HorarioSemanal = { ...data, id: this.nextId(this.horarios) };
    this.horarios.push(nuevo);
    return nuevo;
  }

  deleteHorario(id: number): void {
    this.horarios = this.horarios.filter((h) => h.id !== id);
  }

  // ---- Bloqueos ----
  listBloqueos(profesionalId: number | null = null): Bloqueo[] {
    return profesionalId ? this.bloqueos.filter((b) => b.profesionalId === profesionalId) : this.bloqueos;
  }

  createBloqueo(data: Omit<Bloqueo, 'id'>): Bloqueo {
    const nuevo: Bloqueo = { ...data, id: this.nextId(this.bloqueos) };
    this.bloqueos.push(nuevo);
    return nuevo;
  }

  deleteBloqueo(id: number): void {
    this.bloqueos = this.bloqueos.filter((b) => b.id !== id);
  }

  // ---- Turnos ----
  listTurnos(): Turno[] {
    return this.turnos;
  }

  getTurno(id: number): Turno | undefined {
    return this.turnos.find((t) => t.id === id);
  }

  createTurno(data: { clienteId: number; profesionalId: number; servicioId: number; fechaHoraInicio: string; estado?: Turno['estado']; observaciones?: string | null; creadoPor?: Turno['creadoPor'] }): Turno {
    const servicio = this.getServicio(data.servicioId)!;
    const now = hoyMasHorasIso(0);
    const inicio = new Date(data.fechaHoraInicio);
    const nueva: Turno = {
      id: this.nextId(this.turnos),
      codigo: this.generarCodigo(data.fechaHoraInicio),
      clienteId: data.clienteId,
      profesionalId: data.profesionalId,
      servicioId: data.servicioId,
      fechaHoraInicio: data.fechaHoraInicio,
      fechaHoraFin: new Date(inicio.getTime() + servicio.duracionMin * 60_000).toISOString(),
      estado: data.estado ?? 'reservado',
      precioAplicado: servicio.precio,
      observaciones: data.observaciones ?? null,
      motivoCancelacion: null,
      creadoPor: data.creadoPor ?? 'CLIENTE',
      createdAt: now,
      updatedAt: now,
    };
    this.turnos.push(nueva);
    this.pushHistorial(nueva.id, null, nueva.estado, data.creadoPor === 'CLIENTE' ? 6 : 2, 'Turno creado');
    return nueva;
  }

  updateEstado(id: number, estadoNuevo: Turno['estado'], usuarioId: number | null, detalle?: string): Turno | null {
    const t = this.getTurno(id);
    if (!t) return null;
    this.pushHistorial(id, t.estado, estadoNuevo, usuarioId, detalle ?? null);
    Object.assign(t, { estado: estadoNuevo, updatedAt: hoyMasHorasIso(0) });
    return t;
  }

  reprogramar(id: number, data: { fechaHoraInicio: string; clienteId: number; profesionalId: number; servicioId: number }): Turno | null {
    const t = this.getTurno(id);
    if (!t) return null;
    const servicio = this.getServicio(data.servicioId)!;
    const inicio = new Date(data.fechaHoraInicio);
    const antes = t.fechaHoraInicio;
    Object.assign(t, {
      clienteId: data.clienteId,
      profesionalId: data.profesionalId,
      servicioId: data.servicioId,
      fechaHoraInicio: data.fechaHoraInicio,
      fechaHoraFin: new Date(inicio.getTime() + servicio.duracionMin * 60_000).toISOString(),
      codigo: this.generarCodigo(data.fechaHoraInicio),
      updatedAt: hoyMasHorasIso(0),
    });
    this.pushHistorial(id, null, t.estado, null, `Reprogramado desde ${antes}`);
    return t;
  }

  cancelar(id: number, motivo: string, usuarioId: number | null): Turno | null {
    const t = this.getTurno(id);
    if (!t) return null;
    if (t.estado === 'cancelado') return t;
    const anterior = t.estado;
    Object.assign(t, { estado: 'cancelado', motivoCancelacion: motivo, updatedAt: hoyMasHorasIso(0) });
    this.pushHistorial(id, anterior, 'cancelado', usuarioId, motivo);
    return t;
  }

  pushHistorial(turnoId: number, estadoAnterior: TurnoHistorial['estadoAnterior'], estadoNuevo: Turno['estado'], usuarioId: number | null, detalle: string | null): void {
    this.historial.push({
      id: this.nextId(this.historial),
      turnoId,
      estadoAnterior,
      estadoNuevo,
      usuarioId,
      fechaCambio: hoyMasHorasIso(0),
      detalle,
    });
  }
}

export const mockDB = new MockDatabase();