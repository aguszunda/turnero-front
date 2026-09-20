import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CreateProfesionalDto, Profesional } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ProfesionalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/profesionales`;

  list(soloActivos = false): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(this.apiUrl, { params: { soloActivos: String(soloActivos) } });
  }

  get(id: number): Observable<Profesional> {
    return this.http.get<Profesional>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateProfesionalDto): Observable<Profesional> {
    return this.http.post<Profesional>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateProfesionalDto>): Observable<Profesional> {
    return this.http.patch<Profesional>(`${this.apiUrl}/${id}`, dto);
  }

  setActivo(id: number, activo: boolean): Observable<Profesional> {
    return this.update(id, { activo });
  }

  setServicios(id: number, servicioIds: number[]): Observable<Profesional> {
    return this.update(id, { servicioIds });
  }
}