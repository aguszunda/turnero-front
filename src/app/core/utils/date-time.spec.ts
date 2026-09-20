import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  dateKeyToDate,
  isoFromLocal,
  isoInBloqueo,
  minutesToTime,
  overlaps,
  parseIso,
  timeToMinutes,
  toDateKey,
} from './date-time';

describe('date-time', () => {
  it('convierte "HH:mm" a minutos y viceversa', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('redondea minutos fuera de rango (para horarios de medianoche)', () => {
    expect(minutesToTime(-30)).toBe('23:30');
    expect(minutesToTime(1440)).toBe('00:00');
  });

  it('dateKey <-> Date local', () => {
    const d = dateKeyToDate('2026-09-20');
    expect(toDateKey(d)).toBe('2026-09-20');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // septiembre
    expect(d.getDate()).toBe(20);
  });

  it('isoFromLocal produce un ISO parseable con la misma hora local', () => {
    const iso = isoFromLocal('2026-09-20', '15:45');
    const d = parseIso(iso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(15);
    expect(d.getMinutes()).toBe(45);
  });

  it('addMinutes suma correctamente', () => {
    const base = parseIso(isoFromLocal('2026-09-20', '09:00'));
    expect(addMinutes(base, 30).getHours()).toBe(9);
    expect(addMinutes(base, 30).getMinutes()).toBe(30);
    expect(addMinutes(base, 45).getHours()).toBe(9);
    expect(addMinutes(base, 45).getMinutes()).toBe(45);
  });

  it('detecta superposición de franjas (turnos contiguos NO se superponen)', () => {
    const a = holder('10:00', '10:30');
    const b = holder('10:30', '11:00');
    const c = holder('10:15', '10:45');
    expect(overlaps(a[0], a[1], b[0], b[1])).toBe(false);
    expect(overlaps(a[0], a[1], c[0], c[1])).toBe(true);
  });

  it('isoInBloqueo respeta el rango inclusive', () => {
    const iso = isoFromLocal('2026-09-20', '12:00');
    expect(isoInBloqueo(iso, '2026-09-19', '2026-09-21')).toBe(true);
    expect(isoInBloqueo(iso, '2026-09-20', '2026-09-22')).toBe(true);
    expect(isoInBloqueo(iso, '2026-09-21', '2026-09-22')).toBe(false);
  });
});

function holder(desde: string, hasta: string): [Date, Date] {
  return [parseIso(isoFromLocal('2026-09-20', desde)), parseIso(isoFromLocal('2026-09-20', hasta))];
}