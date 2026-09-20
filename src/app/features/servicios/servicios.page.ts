import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
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
import { CATEGORIAS_SERVICIO, type CategoriaServicio, type Servicio } from '@app/core/models';
import { ServiciosService } from '@app/core/services/servicios.service';
import { ServicioFormDialog } from './servicio-form-dialog';

@Component({
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './servicios.page.html',
  styleUrl: './servicios.page.scss',
})
export class ServiciosPage {
  private serviciosSvc = inject(ServiciosService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  protected readonly servicios = signal<Servicio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly columns = ['nombre', 'servicioCategoria', 'duracion', 'precio', 'activo', 'acciones'];
  protected readonly categoriaLabel = CATEGORIAS_SERVICIO;

  protected categoriaDe(categoria: CategoriaServicio): string {
    return this.categoriaLabel[categoria] ?? categoria;
  }

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      this.servicios.set(await firstValueFrom(this.serviciosSvc.list()));
    } catch (e) {
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirForm(nuevo = true, servicio?: Servicio): void {
    const dialogRef = this.dialog.open(ServicioFormDialog, {
      width: '480px',
      data: servicio ?? null,
    });
    dialogRef.afterClosed().subscribe((resultado: Servicio | null) => {
      if (!resultado) return;
      void this.cargar();
      const accion = nuevo ? 'creado' : 'actualizado';
      this.snackbar.open(`Servicio «${resultado.nombre}» ${accion}`, 'Cerrar', { duration: 3000 });
    });
  }

  protected toggleActivo(s: Servicio): void {
    this.serviciosSvc.setActivo(s.id, !s.activo).subscribe({
      next: () => void this.cargar(),
      error: (e) => this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 }),
    });
  }
}