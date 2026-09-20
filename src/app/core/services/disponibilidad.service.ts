import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { ResultadoDisponibilidad } from '@app/core/services/disponibilidad.util';

export interface ConsultaDisponibilidad {
  servicioId: number;
  /** Si se omite -> "primero disponible". */
  profesionalId?: number;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/disponibilidad`;

  consultar(consulta: ConsultaDisponibilidad): Observable<ResultadoDisponibilidad> {
    const params: Record<string, string> = { servicioId: String(consulta.servicioId), fecha: consulta.fecha };
    if (consulta.profesionalId) params['profesionalId'] = String(consulta.profesionalId);
    return this.http.get<ResultadoDisponibilidad>(this.apiUrl, { params });
  }

  /** Días del mes con al menos un horario disponible (para filtrar el datepicker). */
  consultarDiasDisponibles(
    servicioId: number,
    anio: number,
    mes: number,
    profesionalId?: number,
  ): Observable<string[]> {
    const params: Record<string, string> = {
      servicioId: String(servicioId),
      anio: String(anio),
      mes: String(mes),
    };
    if (profesionalId) params['profesionalId'] = String(profesionalId);
    return this.http.get<string[]>(`${this.apiUrl}/dias`, { params });
  }
}