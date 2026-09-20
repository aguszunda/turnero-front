import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

/** Agrega el token JWT a las peticiones autenticadas. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) return next(req);
  const authed = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authed);
};