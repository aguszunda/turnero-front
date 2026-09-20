import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Injectable } from '@angular/core';

export interface ApiError {
  status: number;
  mensaje: string;
}

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0 && !req.url.startsWith('http')) {
        return throwError(() => ({ status: 0, mensaje: 'No hay conexión con el servidor' } satisfies ApiError));
      }
      const body = error.error as { mensaje?: string } | null;
      return throwError(() => ({
        status: error.status,
        mensaje: body?.mensaje ?? error.statusText ?? 'Error inesperado',
      } satisfies ApiError));
    }),
  );

@Injectable({ providedIn: 'root' })
export class ApiErrorHandler {
  static message(error: unknown): string {
    if (error && typeof error === 'object' && 'mensaje' in error) {
      return String((error as ApiError).mensaje);
    }
    return 'Ocurrió un error inesperado';
  }
}