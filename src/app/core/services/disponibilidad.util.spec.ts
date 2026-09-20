import { describe, expect, it } from 'vitest';
import type { Bloqueo, HorarioSemanal, Profesional, Servicio, Turno } from '@app/core/models';
import {
  consultarDisponibilidad,
  generarSlotsProfesional,
  type GenerarSlotsContext,
  type SlotDisponible,
} from './disponibilidad.util';
import { isoFromLocal, toDateKey } from '@app/core/utils/date-time';

function proximoLunes(): string {
  const hoy = new Date();
  const diff = (1 - hoy.getDay() + 7) % 7; // días hasta el lunes (0 si hoy es lunes)
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + (diff === 0 ? 7 : diff));
  return toDateKey(lunes);
}

function fixture(overrides: Partial<{
  margenMin: number;
  turnos: Turno[];
  bloqueos: Bloqueo[];
}> = {}): {
  servicio: Servicio;
  profesional: Profesional;
  horario: HorarioSemanal;
  lunes: string;
  turnos: Turno[];
  bloqueos: Bloqueo[];
} {
  const lunes = proximoLunes();
  const servicio: Servicio = {
    id: 1,
    nombre: 'Corte',
    descripcion: null,
    duracionMin: 30,
    precio: 5000,
    categoria: 'CORTE',
    activo: true,
    createdAt: '',
    updatedAt: '',
  };
  const profesional: Profesional = {
    id: 10,
    usuarioId: null,
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '123',
    email: 'juan@test.com',
    especialidad: null,
    bio: null,
    activo: true,
    servicios: [servicio],
    createdAt: '',
    updatedAt: '',
  };
  const horario: HorarioSemanal = {
    id: 1,
    profesionalId: 10,
    diaSemana: 1,
    horaInicio: '09:00',
    horaFin: '18:00',
    inicioDescanso: '13:00',
    finDescanso: '14:00',
    margenMin: overrides.margenMin ?? 10,
  };
  const turnos = overrides.turnos ?? [];
  const bloqueos = overrides.bloqueos ?? [];
  return { servicio, profesional, horario, lunes, turnos, bloqueos };
}

function ctxBase(f: ReturnType<typeof fixture>): GenerarSlotsContext {
  return {
    profesional: f.profesional,
    servicio: f.servicio,
    fecha: f.lunes,
    turnos: f.turnos,
    horarios: [f.horario],
    bloqueos: f.bloqueos,
  };
}

const horas = (slots: SlotDisponible[]) => slots.map((s) => s.horaInicio);

describe('generarSlotsProfesional', () => {
  it('genera slots con cadencia de 15 min dentro del horario', () => {
    const f = fixture();
    const slots = generarSlotsProfesional(ctxBase(f));
    expect(horas(slots)[0]).toBe('09:00');
    expect(horas(slots).includes('09:15')).toBe(true);
    expect(horas(slots).includes('09:30')).toBe(true);
    // último inicio = 18:00 - 30min = 17:30
    expect(horas(slots).at(-1)).toBe('17:30');
  });

  it('no ofrece horarios durante el descanso (RN.5)', () => {
    const f = fixture();
    const disponibles = horas(generarSlotsProfesional(ctxBase(f)));
    expect(disponibles.includes('13:00')).toBe(false);
    expect(disponibles.includes('13:30')).toBe(false);
    expect(disponibles.includes('12:30')).toBe(true);
    expect(disponibles.includes('14:00')).toBe(true);
  });

  it('descarta slots que chocan con un turno existente y respeta el margen (RN.3 + RN.6)', () => {
    const f = fixture({ margenMin: 10 });
    const ocupado: Turno = {
      id: 99,
      codigo: 'TN-X',
      clienteId: 1,
      profesionalId: 10,
      servicioId: 1,
      fechaHoraInicio: isoFromLocal(f.lunes, '10:00'),
      fechaHoraFin: isoFromLocal(f.lunes, '10:30'),
      estado: 'reservado',
      precioAplicado: 5000,
      observaciones: null,
      motivoCancelacion: null,
      creadoPor: 'CLIENTE',
      createdAt: '',
      updatedAt: '',
    };
    const slots = generarSlotsProfesional({ ...ctxBase(f), turnos: [ocupado] });
    const disponibles = horas(slots);
    // 10:00-10:30 + margen 10 → bloqueado hasta 10:40
    expect(disponibles.includes('10:00')).toBe(false);
    expect(disponibles.includes('10:15')).toBe(false);
    expect(disponibles.includes('10:30')).toBe(false);
    expect(disponibles.includes('10:45')).toBe(true);
  });

  it('libera el cupo al cancelarse el turno (RF-04.3)', () => {
    const f = fixture();
    const cancelado = { ...(f.turnos[0] as Turno), id: 99, estado: 'cancelado' as const, fechaHoraInicio: isoFromLocal(f.lunes, '10:00'), fechaHoraFin: isoFromLocal(f.lunes, '10:30') };
    const slots = generarSlotsProfesional({ ...ctxBase(f), turnos: [cancelado] });
    expect(horas(slots).includes('10:00')).toBe(true);
  });

  it('sin horario para el día o con bloqueo no devuelve slots (RF-02.3/RF-02.4)', () => {
    const f = fixture();
    const f2 = fixture({
      bloqueos: [
        { id: 1, profesionalId: 10, fechaDesde: f.lunes, fechaHasta: f.lunes, todoElDia: true, motivo: 'Vacaciones' },
      ],
    });
    expect(generarSlotsProfesional(ctxBase(f2))).toHaveLength(0);
    expect(generarSlotsProfesional({ ...ctxBase(f), horarios: [] })).toHaveLength(0);
  });

  it('un servicio de 90 min no supera el fin de jornada (QA #7)', () => {
    const f = fixture();
    const largo: Servicio = { ...f.servicio, id: 2, duracionMin: 90 };
    const slots = generarSlotsProfesional({ ...ctxBase(f), servicio: largo });
    expect(horas(slots).at(-1)).toBe('16:30'); // 16:30 + 90 = 18:00
    expect(horas(slots).includes('17:00')).toBe(false);
  });
});

describe('consultarDisponibilidad', () => {
  it('servicio que el profesional no presta queda sin horarios (RN.10)', () => {
    const f = fixture();
    const ajeno: Servicio = { ...f.servicio, id: 2, categoria: 'COLOR' };
    const profesional: Profesional = { ...f.profesional, servicios: [f.servicio] };
    const res = consultarDisponibilidad(
      [profesional],
      [f.servicio, ajeno],
      f.turnos,
      [f.horario],
      f.bloqueos,
      { servicioId: ajeno.id, profesionalId: profesional.id, fecha: f.lunes },
    );
    expect(res.slots).toHaveLength(0);
  });

  it('"primero disponible" agrega los profesionales libres en cada franja', () => {
    const f = fixture();
    const prof2: Profesional = { ...f.profesional, id: 11, nombre: 'Ana', servicios: [f.servicio] };
    const horario2: HorarioSemanal = { ...f.horario, id: 2, profesionalId: 11, horaInicio: '10:00', horaFin: '14:00' };
    const res = consultarDisponibilidad(
      [f.profesional, prof2],
      [f.servicio],
      [],
      [f.horario, horario2],
      [],
      { servicioId: f.servicio.id, fecha: f.lunes },
    );
    const slot10 = res.slots.find((s) => s.horaInicio === '10:00');
    expect(slot10?.profesionales).toEqual([10, 11]);
    const slot9 = res.slots.find((s) => s.horaInicio === '09:00');
    expect(slot9?.profesionales).toEqual([10]);
  });

  it('no valida un turno que cruza el descanso como disponible', () => {
    const f = fixture();
    // 1) slot 12:30 existe (12:30 + 30 = 13:00 termina justo al empezar el descanso) ✓
    const slots = generarSlotsProfesional(ctxBase(f));
    expect(horas(slots).includes('12:30')).toBe(true);
    // 2) un servicio de 60 min a las 13:00 cruza el descanso → no existe
    const largo: Servicio = { ...f.servicio, id: 3, duracionMin: 60 };
    const slotsLargo = generarSlotsProfesional({ ...ctxBase(f), servicio: largo });
    expect(horas(slotsLargo).includes('13:00')).toBe(false);
  });
});