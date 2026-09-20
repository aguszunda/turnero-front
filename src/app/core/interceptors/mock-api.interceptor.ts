import type { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { HttpResponse as NgHttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import { environment } from '@env/environment';
import { mockDB } from '@app/core/mock/mock-db';
import {
  type CrearClienteDto,
  type Cliente,
  type CreateTurnoDto,
  type EstadoTurno,
  type TokenResponse,
  type Turno,
  type TurnoDetalle,
  type UsuarioLogueado,
} from '@app/core/models';
import { consultarDisponibilidad } from '@app/core/services/disponibilidad.util';
import { dateFallsOn, parseIso, toDateKey } from '@app/core/utils/date-time';

type RespuestaApi = HttpResponseLike | undefined;
interface HttpResponseLike {
  status: number;
  body: unknown;
}

const ok = (body: unknown): HttpResponseLike => ({ status: 200, body: body ?? null });
const created = (body: unknown): HttpResponseLike => ({ status: 201, body: body ?? null });

class MockError extends Error {}

function notFound(): never {
  throw new MockError('Recurso no encontrado');
}

function idAt(segments: string[], index: number): number {
  return Number(segments[index]) || 0;
}

function expandir(t: Turno): TurnoDetalle {
  const profesional = mockDB.getProfesional(t.profesionalId);
  const servicio = mockDB.getServicio(t.servicioId);
  const cliente = mockDB.clientes.find((c) => c.id === t.clienteId);
  return {
    ...t,
    servicioNombre: servicio?.nombre ?? '—',
    profesionalNombre: profesional ? `${profesional.nombre} ${profesional.apellido}` : '—',
    clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : '—',
    clienteEmail: cliente?.email ?? '—',
    clienteTelefono: cliente?.telefono ?? '—',
  };
}

function filtrarTurnos(lista: Turno[], params: URLSearchParams): Turno[] {
  const fecha = params.get('fecha');
  const profesionalId = params.get('profesionalId');
  const servicioId = params.get('servicioId');
  const clienteId = params.get('clienteId');
  const estado = params.get('estado');
  return lista.filter((t) => {
    if (fecha && !dateFallsOn(parseIso(t.fechaHoraInicio), fecha)) return false;
    if (profesionalId && t.profesionalId !== Number(profesionalId)) return false;
    if (servicioId && t.servicioId !== Number(servicioId)) return false;
    if (clienteId && t.clienteId !== Number(clienteId)) return false;
    if (estado && t.estado !== estado) return false;
    return true;
  });
}

function crearUsuarioCliente(dto: CrearClienteDto & { password: string }): UsuarioLogueado {
  if (mockDB.usuarios.some((u) => u.email === dto.email)) {
    throw new MockError('El email ya está registrado');
  }
  const now = new Date().toISOString();
  const usuarioId = mockDB.usuarios.reduce((m, u) => Math.max(m, u.id), 0) + 1;
  mockDB.usuarios.push({
    id: usuarioId,
    email: dto.email,
    passwordHash: dto.password,
    rol: 'CLIENTE',
    activo: true,
    createdAt: now,
    updatedAt: now,
  });
  const cliente: Cliente = {
    id: mockDB.clientes.reduce((m, c) => Math.max(m, c.id), 0) + 1,
    usuarioId,
    nombre: dto.nombre,
    apellido: dto.apellido,
    telefono: dto.telefono,
    email: dto.email,
    fechaNacimiento: dto.fechaNacimiento ?? null,
    notas: dto.notas ?? null,
    activo: true,
    createdAt: now,
    updatedAt: now,
  };
  mockDB.clientes.push(cliente);
  return mockDB.getUsuarioLogueado(dto.email)!;
}

function turnoCruzaRestricciones(body: { profesionalId: number; servicioId: number; fechaHoraInicio: string }): boolean {
  const resultado = consultarDisponibilidad(
    mockDB.listProfesionales(),
    mockDB.listServicios(),
    mockDB.listTurnos(),
    mockDB.listHorarios(),
    mockDB.listBloqueos(),
    {
      servicioId: body.servicioId,
      profesionalId: body.profesionalId,
      fecha: toDateKey(new Date(body.fechaHoraInicio)),
    },
  );
  const d = new Date(body.fechaHoraInicio);
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return !resultado.slots.some((s) => s.horaInicio === hora);
}

function validarYCrearTurno(body: CreateTurnoDto): Turno {
  const profesional = mockDB.getProfesional(body.profesionalId);
  const servicio = mockDB.getServicio(body.servicioId);
  if (!profesional || !profesional.activo) throw new MockError('El profesional no está disponible');
  if (!servicio || !servicio.activo) throw new MockError('El servicio no está disponible');
  if (!profesional.servicios.some((s) => s.id === servicio.id)) {
    throw new MockError('El profesional no presta ese servicio');
  }
  if (turnoCruzaRestricciones(body)) throw new MockError('El horario elegido no está disponible');
  return mockDB.createTurno(body);
}

function validarYReprogramar(id: number, fechaHoraInicio: string, turno: Turno): Turno {
  const body = {
    fechaHoraInicio,
    clienteId: turno.clienteId,
    profesionalId: turno.profesionalId,
    servicioId: turno.servicioId,
  };
  if (turnoCruzaRestricciones(body)) throw new MockError('El horario elegido no está disponible');
  return mockDB.reprogramar(id, body)!;
}

function route(req: HttpRequest<unknown>, segments: string[], params: URLSearchParams, method: string): RespuestaApi {
  const [a, b, c] = segments;

  // ---- Auth ----
  if (a === 'auth' && b === 'login' && method === 'POST') {
    const body = req.body as { email: string; password: string };
    const usuario = mockDB.usuarios.find((u) => u.email === body.email);
    if (!usuario || !usuario.activo || (usuario.passwordHash ?? '') !== body.password) {
      throw new MockError('Credenciales inválidas');
    }
    const usuarioLog = mockDB.getUsuarioLogueado(usuario.email)!;
    const payload = btoa(JSON.stringify({ sub: usuario.id, rol: usuario.rol, exp: Date.now() + 86_400_000 }));
    return ok({ token: `mock.jwt.${payload}.signature`, usuario: usuarioLog } satisfies TokenResponse);
  }
  if (a === 'auth' && b === 'register' && method === 'POST') {
    const log = crearUsuarioCliente(req.body as CrearClienteDto & { password: string });
    const payload = btoa(JSON.stringify({ sub: log.id, rol: log.rol, exp: Date.now() + 86_400_000 }));
    return created({ token: `mock.jwt.${payload}.signature`, usuario: log } satisfies TokenResponse);
  }

  // ---- Servicios ----
  if (a === 'servicios') {
    if (method === 'GET') {
      const lista = mockDB.listServicios();
      return ok(params.get('soloActivos') === 'true' ? lista.filter((s) => s.activo) : lista);
    }
    if (method === 'POST') {
      const body = req.body as Omit<import('@app/core/models').Servicio, 'id' | 'createdAt' | 'updatedAt'>;
      return created(mockDB.createServicio(body));
    }
    if ((method === 'PATCH' || method === 'PUT') && b) {
      const s = mockDB.updateServicio(idAt(segments, 1), (req.body ?? {}) as Partial<import('@app/core/models').Servicio>);
      if (!s) notFound();
      return ok(s);
    }
  }

  // ---- Profesionales ----
  if (a === 'profesionales' && !b) {
    if (method === 'GET') {
      const lista = mockDB.listProfesionales();
      return ok(params.get('soloActivos') === 'true' ? lista.filter((p) => p.activo) : lista);
    }
    if (method === 'POST') {
      return created(mockDB.createProfesional(req.body as never));
    }
  }
  if (a === 'profesionales' && b && method === 'PATCH') {
    const p = mockDB.updateProfesional(idAt(segments, 1), (req.body ?? {}) as Record<string, unknown>);
    if (!p) notFound();
    return ok(p);
  }

  // ---- Horarios semanales ----
  if (a === 'horarios') {
    if (method === 'GET') {
      const profissionalId = params.get('profesionalId') ? Number(params.get('profesionalId')) : null;
      return ok(mockDB.listHorarios(profissionalId));
    }
    if (method === 'POST') return created(mockDB.upsertHorario(req.body as never));
    if (method === 'DELETE' && b) {
      mockDB.deleteHorario(idAt(segments, 1));
      return ok({ eliminado: true });
    }
  }

  // ---- Bloqueos ----
  if (a === 'bloqueos') {
    if (method === 'GET') {
      const profissionalId = params.get('profesionalId') ? Number(params.get('profesionalId')) : null;
      return ok(mockDB.listBloqueos(profissionalId));
    }
    if (method === 'POST') return created(mockDB.createBloqueo(req.body as never));
    if (method === 'DELETE' && b) {
      mockDB.deleteBloqueo(idAt(segments, 1));
      return ok({ eliminado: true });
    }
  }

  // ---- Disponibilidad ----
  if (a === 'disponibilidad' && b === 'dias' && method === 'GET') {
    const servicioId = Number(params.get('servicioId') ?? 0);
    const anio = Number(params.get('anio') ?? new Date().getFullYear());
    const mes = Number(params.get('mes') ?? new Date().getMonth());
    const profesionalId = params.get('profesionalId') ? Number(params.get('profesionalId')) : undefined;
    const dias = new Date(anio, mes + 1, 0).getDate();
    const conSlots: string[] = [];
    for (let d = 1; d <= dias; d++) {
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const res = consultarDisponibilidad(mockDB.listProfesionales(), mockDB.listServicios(), mockDB.listTurnos(), mockDB.listHorarios(), mockDB.listBloqueos(), { servicioId, profesionalId, fecha });
      if (res.slots.length > 0) conSlots.push(fecha);
    }
    return ok(conSlots);
  }
  if (a === 'disponibilidad' && !b && method === 'GET') {
    const servicioId = Number(params.get('servicioId') ?? 0);
    const profesionalId = params.get('profesionalId') ? Number(params.get('profesionalId')) : undefined;
    const fecha = params.get('fecha') ?? toDateKey(new Date());
    return ok(consultarDisponibilidad(mockDB.listProfesionales(), mockDB.listServicios(), mockDB.listTurnos(), mockDB.listHorarios(), mockDB.listBloqueos(), { servicioId, profesionalId, fecha }));
  }

  // ---- Turnos ----
  if (a === 'turnos') {
    if (b === 'detalle' && method === 'GET') return ok(filtrarTurnos(mockDB.listTurnos(), params).map(expandir));
    if (!b && method === 'GET') return ok(filtrarTurnos(mockDB.listTurnos(), params));
    if (!b && method === 'POST') return created(validarYCrearTurno(req.body as CreateTurnoDto));
    if (b && method === 'GET') {
      const t = mockDB.getTurno(idAt(segments, 1));
      if (!t) notFound();
      return ok(expandir(t!));
    }
    if (b && c === 'estado' && method === 'PATCH') {
      const { estado } = req.body as { estado: EstadoTurno };
      const usuarioId = params.get('usuarioId') ? Number(params.get('usuarioId')) : null;
      const t = mockDB.updateEstado(idAt(segments, 1), estado, usuarioId);
      if (!t) notFound();
      return ok(expandir(t!));
    }
    if (b && c === 'reprogramar' && method === 'POST') {
      const turno = mockDB.getTurno(idAt(segments, 1));
      if (!turno) notFound();
      return ok(expandir(validarYReprogramar(idAt(segments, 1), (req.body as { fechaHoraInicio: string }).fechaHoraInicio, turno!)));
    }
    if (b && c === 'cancelar' && method === 'POST') {
      const t = mockDB.cancelar(idAt(segments, 1), (req.body as { motivo: string }).motivo, params.get('usuarioId') ? Number(params.get('usuarioId')) : null);
      if (!t) notFound();
      return ok(expandir(t!));
    }
  }

  // ---- Clientes ----
  if (a === 'clientes' && !b && method === 'GET') return ok(mockDB.clientes);

  return undefined;
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockEnabled) return next(req);

  const url = new URL(req.url);
  const rest = url.pathname.split('/').filter(Boolean);
  const apiIdx = rest.indexOf('api');
  const segments = apiIdx >= 0 ? rest.slice(apiIdx + 1) : rest;

  try {
    const resultado = route(req, segments, url.searchParams, req.method);
    if (resultado === undefined) return next(req);
    return of(new NgHttpResponse({ status: resultado.status, body: resultado.body })).pipe(delay(200));
  } catch (e) {
    const status = e instanceof MockError ? 400 : 500;
    const mensaje = e instanceof Error ? e.message : 'Error interno';
    return of(new NgHttpResponse({ status, body: { mensaje } })).pipe(delay(200));
  }
};