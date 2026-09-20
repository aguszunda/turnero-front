import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { Cliente } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  list(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }
}