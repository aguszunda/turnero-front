import { Routes } from '@angular/router';
import { authGuard, loginGuard } from '@app/core/guards/auth.guard';
import { roleChildGuard, roleGuard } from '@app/core/guards/role.guard';
import { ROLES } from '@app/core/models';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/auth/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivateChild: [roleChildGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'reservas' },
      {
        path: 'reservas',
        loadComponent: () => import('./features/reservas/nueva-reserva/nueva-reserva.page').then((m) => m.NuevaReservaPage),
      },
      {
        path: 'mis-turnos',
        loadComponent: () => import('./features/reservas/mis-turnos/mis-turnos.page').then((m) => m.MisTurnosPage),
        data: { roles: [ROLES.CLIENTE] },
      },
      {
        path: 'servicios',
        canActivate: [roleGuard],
        data: { roles: [ROLES.ADMIN, ROLES.RECEPCIONISTA] },
        loadComponent: () => import('./features/servicios/servicios.page').then((m) => m.ServiciosPage),
      },
      {
        path: 'profesionales',
        canActivate: [roleGuard],
        data: { roles: [ROLES.ADMIN, ROLES.RECEPCIONISTA] },
        loadComponent: () => import('./features/profesionales/profesionales.page').then((m) => m.ProfesionalesPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];