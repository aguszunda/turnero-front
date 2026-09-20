import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import type { Profesional } from '@app/core/models';
import { ProfesionalesService } from '@app/core/services/profesionales.service';
import { ProfesionalFormDialog } from './profesional-form-dialog';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './profesionales.page.html',
  styleUrl: './profesionales.page.scss',
})
export class ProfesionalesPage {
  private profesionalesSvc = inject(ProfesionalesService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  protected readonly profesionales = signal<Profesional[]>([]);
  protected readonly cargando = signal(true);
  protected readonly columns = ['nombre', 'especialidad', 'servicios', 'contacto', 'activo', 'acciones'];

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      this.profesionales.set(await firstValueFrom(this.profesionalesSvc.list()));
    } catch (e) {
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirForm(nuevo = true, profesional?: Profesional): void {
    const dialogRef = this.dialog.open(ProfesionalFormDialog, {
      width: '760px',
      maxWidth: '96vw',
      data: nuevo ? null : profesional,
    });
    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado) return;
      void this.cargar();
    });
  }

  protected toggleActivo(p: Profesional): void {
    this.profesionalesSvc.setActivo(p.id, !p.activo).subscribe({
      error: (e) => this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 }),
      next: () => void this.cargar(),
    });
  }
}