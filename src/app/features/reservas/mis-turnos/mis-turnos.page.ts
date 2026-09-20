import { Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import type { TurnoDetalle } from '@app/core/models';
import { AuthService } from '@app/core/services/auth.service';
import { TurnosService } from '@app/core/services/turnos.service';
import { parseIso } from '@app/core/utils/date-time';
import { CancelarDialogComponent } from '@app/shared/components/cancelar-dialog/cancelar-dialog';
import { EstadoBadgeComponent } from '@app/shared/components/estado-badge/estado-badge.component';
import { ReprogramarDialogComponent, type ReprogramarDialogData } from '../reprogramar-dialog/reprogramar-dialog';

@Component({
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    EstadoBadgeComponent,
  ],
  templateUrl: './mis-turnos.page.html',
  styleUrl: './mis-turnos.page.scss',
})
export class MisTurnosPage {
  private turnosSvc = inject(TurnosService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  protected readonly turnos = signal<TurnoDetalle[]>([]);
  protected readonly cargando = signal(true);
  protected readonly accionTurnoId = signal<number | null>(null);

  constructor() {
    void this.cargarTurnos();
  }

  private async cargarTurnos(): Promise<void> {
    const clienteId = this.auth.clienteId();
    if (clienteId === null) return;
    try {
      const lista = await firstValueFrom(this.turnosSvc.listDetalle({ clienteId }));
      this.turnos.set(
        (lista ?? []).sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio)),
      );
    } catch (e) {
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargando.set(false);
    }
  }

  protected esPasado(t: TurnoDetalle): boolean {
    return parseIso(t.fechaHoraFin).getTime() < Date.now();
  }

  protected puedeCancelar(t: TurnoDetalle): boolean {
    if (!['pendiente', 'reservado'].includes(t.estado)) return false;
    const ventanaMs = environment.ventanaCancelacionHoras * 3_600_000;
    return parseIso(t.fechaHoraInicio).getTime() - Date.now() > ventanaMs;
  }

  protected cancelarTurno(t: TurnoDetalle): void {
    const dialogRef = this.dialog.open(CancelarDialogComponent, { width: '420px' });
    dialogRef.afterClosed().subscribe((motivo?: string) => {
      if (!motivo) return;
      this.accionTurnoId.set(t.id);
      this.turnosSvc.cancelar(t.id, motivo, this.auth.user()?.id ?? null).subscribe({
        next: () => {
          this.accionTurnoId.set(null);
          this.snackbar.open(`Turno #${t.codigo} cancelado`, 'Cerrar', { duration: 3000 });
          void this.cargarTurnos();
        },
        error: (e) => {
          this.accionTurnoId.set(null);
          this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  protected reprogramarTurno(t: TurnoDetalle): void {
    const dialogRef = this.dialog.open(ReprogramarDialogComponent, {
      width: '460px',
      data: { turno: t } satisfies ReprogramarDialogData,
    });
    dialogRef.afterClosed().subscribe((nuevaFechaHora?: string) => {
      if (!nuevaFechaHora) return;
      this.accionTurnoId.set(t.id);
      this.turnosSvc.reprogramar(t.id, nuevaFechaHora).subscribe({
        next: () => {
          this.accionTurnoId.set(null);
          this.snackbar.open(`Turno #${t.codigo} reprogramado`, 'Cerrar', { duration: 3000 });
          void this.cargarTurnos();
        },
        error: (e) => {
          this.accionTurnoId.set(null);
          this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 5000 });
        },
      });
    });
  }
}