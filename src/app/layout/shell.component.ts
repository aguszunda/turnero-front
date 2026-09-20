import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { ROLES, type Rol } from '@app/core/models';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Reservar turno', path: '/reservas', icon: 'event' },
  { label: 'Mis turnos', path: '/mis-turnos', icon: 'event_note', roles: ['CLIENTE'] },
  { label: 'Servicios', path: '/servicios', icon: 'content_cut', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { label: 'Profesionales', path: '/profesionales', icon: 'groups', roles: ['ADMIN', 'RECEPCIONISTA'] },
];

@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly rol = computed(() => (this.user() ? ROLES[this.user()!.rol] : ''));
  protected readonly nombreCompleto = computed(() =>
    this.user() ? `${this.user()!.nombre} ${this.user()!.apellido}`.trim() : '',
  );

  protected readonly items = computed(() => {
    const rol = this.auth.rol();
    return NAV_ITEMS.filter(({ roles }) => !roles || (rol !== null && roles.includes(rol)));
  });

  protected logout(): void {
    this.auth.logout();
    // el logout redirige; en SPA es suficiente
    void this.router.navigate(['/login']);
  }
}