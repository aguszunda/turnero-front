import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateChildFn, CanActivateFn } from '@angular/router';
import type { Rol } from '@app/core/models';
import { AuthService } from '@app/core/services/auth.service';

function puedeAcceder(roles: Rol[] | undefined): boolean | ReturnType<Router['createUrlTree']> {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!roles || roles.length === 0) return true;
  if (auth.tieneRol(...roles)) return true;
  return router.createUrlTree(['/']);
}

export const roleGuard: CanActivateFn = (route) => puedeAcceder(route.data['roles'] as Rol[] | undefined);

export const roleChildGuard: CanActivateChildFn = (route) => puedeAcceder(route.data['roles'] as Rol[] | undefined);