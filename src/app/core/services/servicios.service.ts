import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CreateServicioDto, Servicio } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/servicios`;

  list(soloActivos = false): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.apiUrl, { params: { soloActivos: String(soloActivos) } });
  }

  create(dto: CreateServicioDto): Observable<Servicio> {
    return this.http.post<Servicio>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateServicioDto>): Observable<Servicio> {
    return this.http.patch<Servicio>(`${this.apiUrl}/${id}`, dto);
  }

  setActivo(id: number, activo: boolean): Observable<Servicio> {
    return this.update(id, { activo });
  }
}