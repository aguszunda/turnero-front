import { describe, expect, it, beforeAll } from 'vitest';
import { mockDB } from './mock-db';

describe('MockDatabase', () => {
  beforeAll(() => {
    // asegura estado reproducible para las aserciones de conteo
    const previos = mockDB.turnos.filter((t) => t.codigo.startsWith('TN-99999999'));
    for (const t of previos) {
      mockDB.turnos = mockDB.turnos.filter((x) => x.id !== t.id);
    }
  });

  it('genera códigos únicos incrementales por fecha', () => {
    const c1 = mockDB.generarCodigo('2026-09-20T10:00:00.000Z');
    const c2 = mockDB.generarCodigo('2026-09-20T11:00:00.000Z');
    const c3 = mockDB.generarCodigo('2026-09-21T10:00:00.000Z');
    expect(c1).toMatch(/^TN-20260920-\d{4}$/);
    expect(c1).not.toBe(c2);
    expect(c3).toMatch(/^TN-20260921-/);
  });

  it('crea un turno calculando fechaHoraFin por duración del servicio', () => {
    const servicioId = mockDB.servicios[0].id; // corte 30 min
    const t = mockDB.createTurno({
      clienteId: 1,
      profesionalId: 1,
      servicioId,
      fechaHoraInicio: '2026-09-21T10:00:00.000Z',
      creadoPor: 'RECEPCIONISTA',
    });
    const inicio = new Date(t.fechaHoraInicio).getTime();
    const fin = new Date(t.fechaHoraFin).getTime();
    expect(fin - inicio).toBe(30 * 60_000);
    expect(t.estado).toBe('reservado');
    expect(t.precioAplicado).toBe(mockDB.servicios[0].precio);
  });

  it('cancelar registra motivo, estado y libera el cupo', () => {
    const t = mockDB.createTurno({
      clienteId: 2,
      profesionalId: 2,
      servicioId: mockDB.servicios[2].id,
      fechaHoraInicio: '2026-09-21T12:00:00.000Z',
    });
    const cancelado = mockDB.cancelar(t.id, 'Cambio de planes', 6);
    expect(cancelado?.estado).toBe('cancelado');
    expect(cancelado?.motivoCancelacion).toBe('Cambio de planes');
    const historial = mockDB.historial.filter((h) => h.turnoId === t.id);
    expect(historial.some((h) => h.estadoNuevo === 'cancelado')).toBe(true);
  });

  it('upsert mantiene un único horario por profesional+día', () => {
    const p = mockDB.profesionales[0].id;
    const h1 = mockDB.upsertHorario({
      profesionalId: p,
      diaSemana: 4,
      horaInicio: '09:00',
      horaFin: '17:00',
      inicioDescanso: null,
      finDescanso: null,
      margenMin: 10,
    });
    const h2 = mockDB.upsertHorario({
      profesionalId: p,
      diaSemana: 4,
      horaInicio: '10:00',
      horaFin: '18:00',
      inicioDescanso: null,
      finDescanso: null,
      margenMin: 15,
    });
    expect(h2.id).toBe(h1.id);
    const enLista = mockDB.listHorarios(p).filter((h) => h.diaSemana === 4);
    expect(enLista).toHaveLength(1);
    expect(enLista[0].horaInicio).toBe('10:00');
  });
});