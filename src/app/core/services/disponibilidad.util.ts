import type { Bloqueo, HorarioSemanal, Profesional, Servicio, Turno } from '@app/core/models';
import {
  addMinutes,
  dateFallsOn,
  isoFromLocal,
  minutesToTime,
  parseIso,
  rangeInDates,
  timeToMinutes,
  todayKey,
} from '@app/core/utils/date-time';

export interface SlotDisponible {
  /** Hora local de inicio "HH:mm". */
  horaInicio: string;
  horaFin: string;
  /** Ids de profesionales libres en ese horario (más de uno en "primero disponible"). */
  profesionales: number[];
}

export interface ResultadoDisponibilidad {
  fecha: string;
  servicioId: number;
  profesionalId: number | null;
  slots: SlotDisponible[];
}

export interface GenerarSlotsContext {
  profesional: Profesional;
  servicio: Servicio;
  fecha: string;
  turnos: Turno[];
  horarios: HorarioSemanal[];
  bloqueos: Bloqueo[];
}

/** Pasos de búsqueda de horarios (cuadricula de 15 min). */
export const CADENCIA_MIN = 15;

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function nombreDia(diaSemana: number): string {
  return DAYS[diaSemana];
}

function horarioDelDia(horarios: HorarioSemanal[], profesionalId: number, fecha: Date): HorarioSemanal | null {
  const h = horarios.find(
    (x) => x.profesionalId === profesionalId && x.diaSemana === fecha.getDay(),
  );
  return h ?? null;
}

function profesionalBloqueado(bloqueos: Bloqueo[], profesionalId: number, fecha: string): boolean {
  return bloqueos.some(
    (b) => b.profesionalId === profesionalId && rangeInDates(b.fechaDesde, b.fechaHasta, fecha),
  );
}

/** Franjas laborales del día tras descontar el descanso (hasta 2 segmentos). */
function franjasDelHorario(horario: HorarioSemanal): { inicioMin: number; finMin: number }[] {
  const inicio = timeToMinutes(horario.horaInicio);
  const fin = timeToMinutes(horario.horaFin);
  const descIni = horario.inicioDescanso ? timeToMinutes(horario.inicioDescanso) : null;
  const descFin = horario.finDescanso ? timeToMinutes(horario.finDescanso) : null;
  if (descIni !== null && descFin !== null && descIni >= inicio && descFin <= fin) {
    return [
      { inicioMin: inicio, finMin: descIni },
      { inicioMin: descFin, finMin: fin },
    ];
  }
  return [{ inicioMin: inicio, finMin: fin }];
}

/** Intervalos ocupados del profesional en la fecha, expandidos por el margen entre turnos. */
function ocupadosDelDia(
  turnos: Turno[],
  profesionalId: number,
  fecha: string,
  margenMin: number,
): { inicio: Date; fin: Date }[] {
  return turnos
    .filter(
      (t) =>
        t.profesionalId === profesionalId &&
        t.estado !== 'cancelado' &&
        t.estado !== 'no_asistio' &&
        dateFallsOn(parseIso(t.fechaHoraInicio), fecha),
    )
    .map((t) => ({
      inicio: parseIso(t.fechaHoraInicio),
      fin: addMinutes(parseIso(t.fechaHoraFin), margenMin),
    }));
}

function slotsDeFranja(
  franja: { inicioMin: number; finMin: number },
  servicio: Servicio,
  fecha: string,
  ocupados: { inicio: Date; fin: Date }[],
  profesionalId: number,
): SlotDisponible[] {
  const now = new Date();
  const slots: SlotDisponible[] = [];
  const finFranjaMin = franja.finMin;
  const ultimoInicio = finFranjaMin - servicio.duracionMin;

  for (let inicioMin = franja.inicioMin; inicioMin <= ultimoInicio; inicioMin += CADENCIA_MIN) {
    if (inicioMin + servicio.duracionMin > finFranjaMin) break;

    const inicio = parseIso(isoFromLocal(fecha, minutesToTime(inicioMin)));
    const fin = addMinutes(inicio, servicio.duracionMin);

    if (fecha === todayKey() && inicio <= now) continue;

    let libre = true;
    for (const o of ocupados) {
      if (inicio < o.fin && fin > o.inicio) {
        libre = false;
        break;
      }
    }
    if (libre) {
      slots.push({
        horaInicio: minutesToTime(inicioMin),
        horaFin: minutesToTime(inicioMin + servicio.duracionMin),
        profesionales: [profesionalId],
      });
    }
  }
  return slots;
}

/** Genera slots disponibles para UN profesional en una fecha. */
export function generarSlotsProfesional(ctx: GenerarSlotsContext): SlotDisponible[] {
  const fecha = new Date(`${ctx.fecha}T00:00:00`);
  const horario = horarioDelDia(ctx.horarios, ctx.profesional.id, fecha);
  if (!horario) return [];
  if (profesionalBloqueado(ctx.bloqueos, ctx.profesional.id, ctx.fecha)) return [];

  const ocupados = ocupadosDelDia(ctx.turnos, ctx.profesional.id, ctx.fecha, horario.margenMin);
  const franjas = franjasDelHorario(horario);
  const slots: SlotDisponible[] = [];
  for (const franja of franjas) {
    slots.push(...slotsDeFranja(franja, ctx.servicio, ctx.fecha, ocupados, ctx.profesional.id));
  }
  return slots;
}

/** Genera slots agregando profesionales libres por horario ("primero disponible"). */
export function generarSlotsMulti(
  contextos: GenerarSlotsContext[],
  resultado: ResultadoDisponibilidad,
): ResultadoDisponibilidad {
  const porHora = new Map<string, Set<number>>();
  for (const ctx of contextos) {
    const slots = generarSlotsProfesional(ctx);
    for (const s of slots) {
      const key = s.horaInicio;
      if (!porHora.has(key)) porHora.set(key, new Set());
      for (const p of s.profesionales) porHora.get(key)!.add(p);
    }
  }

  const slots: SlotDisponible[] = [];
  for (const [hora, profs] of porHora) {
    const duracion = contextos[0]?.servicio.duracionMin ?? 0;
    slots.push({
      horaInicio: hora,
      horaFin: minutesToTime(timeToMinutes(hora) + duracion),
      profesionales: [...profs].sort((a, b) => a - b),
    });
  }

  return {
    ...resultado,
    slots: slots.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
  };
}

/** Endpoint de disponibilidad: profesional opcional, horarios discretos de 15 min. */
export function consultarDisponibilidad(
  profesionales: Profesional[],
  servicios: Servicio[],
  turnos: Turno[],
  horarios: HorarioSemanal[],
  bloqueos: Bloqueo[],
  consulta: { servicioId: number; profesionalId?: number; fecha: string },
): ResultadoDisponibilidad {
  const servicio = servicios.find((s) => s.id === consulta.servicioId);
  if (!servicio) return { fecha: consulta.fecha, servicioId: consulta.servicioId, profesionalId: consulta.profesionalId ?? null, slots: [] };

  const resultadoBase: ResultadoDisponibilidad = {
    fecha: consulta.fecha,
    servicioId: consulta.servicioId,
    profesionalId: consulta.profesionalId ?? null,
    slots: [],
  };

  if (consulta.profesionalId) {
    const profesional = profesionales.find((p) => p.id === consulta.profesionalId);
    if (!profesional || !profesional.servicios.some((s) => s.id === consulta.servicioId)) {
      return resultadoBase;
    }
    return {
      ...resultadoBase,
      slots: generarSlotsProfesional({
        profesional,
        servicio,
        fecha: consulta.fecha,
        turnos,
        horarios,
        bloqueos,
      }),
    };
  }

  const capaces = profesionales.filter((p) => p.activo && p.servicios.some((s) => s.id === consulta.servicioId));
  return generarSlotsMulti(
    capaces.map((profesional) => ({ profesional, servicio, fecha: consulta.fecha, turnos, horarios, bloqueos })),
    resultadoBase,
  );
}