import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type {
  CancelarTurnoDto,
  CreateTurnoDto,
  EstadoTurno,
  Turno,
  TurnoDetalle,
} from '@app/core/models';

export interface TurnoFiltros {
  fecha?: string;
  profesionalId?: number;
  servicioId?: number;
  clienteId?: number;
  estado?: EstadoTurno | string;
}

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/turnos`;

  list(filtros: TurnoFiltros = {}): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.apiUrl, { params: this.aParams(filtros) });
  }

  listDetalle(filtros: TurnoFiltros = {}): Observable<TurnoDetalle[]> {
    return this.http.get<TurnoDetalle[]>(`${this.apiUrl}/detalle`, { params: this.aParams(filtros) });
  }

  get(id: number): Observable<TurnoDetalle> {
    return this.http.get<TurnoDetalle>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateTurnoDto): Observable<Turno> {
    return this.http.post<Turno>(this.apiUrl, dto);
  }

  cambiarEstado(id: number, estado: EstadoTurno, usuarioId: number | null = null): Observable<TurnoDetalle> {
    return this.http.patch<TurnoDetalle>(`${this.apiUrl}/${id}/estado`, { estado }, { params: { usuarioId: usuarioId ? String(usuarioId) : '' } });
  }

  reprogramar(id: number, fechaHoraInicio: string): Observable<TurnoDetalle> {
    return this.http.post<TurnoDetalle>(`${this.apiUrl}/${id}/reprogramar`, { fechaHoraInicio });
  }

  cancelar(id: number, motivo: string, usuarioId: number | null = null): Observable<TurnoDetalle> {
    const dto: CancelarTurnoDto = { motivo };
    return this.http.post<TurnoDetalle>(`${this.apiUrl}/${id}/cancelar`, dto, { params: { usuarioId: usuarioId ? String(usuarioId) : '' } });
  }

  private aParams(f: TurnoFiltros): Record<string, string> {
    const p: Record<string, string> = {};
    if (f.fecha) p['fecha'] = f.fecha;
    if (f.profesionalId) p['profesionalId'] = String(f.profesionalId);
    if (f.servicioId) p['servicioId'] = String(f.servicioId);
    if (f.clienteId) p['clienteId'] = String(f.clienteId);
    if (f.estado) p['estado'] = f.estado;
    return p;
  }
}