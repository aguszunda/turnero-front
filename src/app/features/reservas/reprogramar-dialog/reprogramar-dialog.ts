import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import type { TurnoDetalle } from '@app/core/models';
import { DisponibilidadService } from '@app/core/services/disponibilidad.service';
import type { ResultadoDisponibilidad } from '@app/core/services/disponibilidad.util';
import { isoFromLocal } from '@app/core/utils/date-time';

export interface ReprogramarDialogData {
  turno: TurnoDetalle;
}

@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './reprogramar-dialog.html',
  styleUrl: './reprogramar-dialog.scss',
})
export class ReprogramarDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ReprogramarDialogComponent>);
  private disponibilidad = inject(DisponibilidadService);
  private snackbar = inject(MatSnackBar);

  protected readonly turno: TurnoDetalle = (inject(MAT_DIALOG_DATA) as ReprogramarDialogData).turno;

  protected readonly minFecha = new Date();
  protected readonly maxFecha = new Date(Date.now() + 60 * 86_400_000);

  protected readonly fechaDate = signal<Date | null>(null);
  protected readonly resultado = signal<ResultadoDisponibilidad | null>(null);
  protected readonly horaSeleccionada = signal<string | null>(null);
  protected readonly cargando = signal(false);

  protected readonly fecha = computed(() => (this.fechaDate() ? keyOf(this.fechaDate()!) : null));

  protected onFecha(): void {
    const f = this.fecha();
    if (!f || !this.turno) return;
    this.horaSeleccionada.set(null);
    this.cargando.set(true);
    this.disponibilidad
      .consultar({ servicioId: this.turno.servicioId, profesionalId: this.turno.profesionalId, fecha: f })
      .subscribe({
        next: (res) => {
          this.resultado.set(res);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
        },
      });
  }

  protected confirmar(): void {
    const f = this.fecha();
    const hora = this.horaSeleccionada();
    if (!f || !hora) return;
    this.dialogRef.close(isoFromLocal(f, hora));
  }
}

function keyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}