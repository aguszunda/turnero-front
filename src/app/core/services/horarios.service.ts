import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CreateHorarioDto, HorarioSemanal } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/horarios`;

  list(profesionalId: number | null = null): Observable<HorarioSemanal[]> {
    const params: Record<string, string> = {};
    if (profesionalId !== null) params['profesionalId'] = String(profesionalId);
    return this.http.get<HorarioSemanal[]>(this.apiUrl, { params });
  }

  upsert(dto: CreateHorarioDto): Observable<HorarioSemanal> {
    return this.http.post<HorarioSemanal>(this.apiUrl, dto);
  }

  delete(id: number): Observable<{ eliminado: boolean }> {
    return this.http.delete<{ eliminado: boolean }>(`${this.apiUrl}/${id}`);
  }
}