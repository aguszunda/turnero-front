import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import { CATEGORIAS_LIST, type CategoriaServicio, type CreateServicioDto, type Servicio } from '@app/core/models';
import { ServiciosService } from '@app/core/services/servicios.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './servicio-form-dialog.html',
})
export class ServicioFormDialog {
  private fb = inject(FormBuilder);
  private serviciosSvc = inject(ServiciosService);
  private snackbar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialogRef<ServicioFormDialog>);
  private readonly servicio: Servicio | null = inject(MAT_DIALOG_DATA);

  protected readonly categorias = CATEGORIAS_LIST;
  protected readonly guardando = signal(false);

  protected readonly form = this.fb.group({
    nombre: [this.servicio?.nombre ?? '', Validators.required],
    descripcion: [this.servicio?.descripcion ?? ''],
    duracionMin: [this.servicio?.duracionMin ?? 30, [Validators.required, Validators.min(5)]],
    precio: [this.servicio?.precio ?? 0, [Validators.required, Validators.min(0)]],
    categoria: [this.servicio?.categoria ?? ('CORTE' satisfies CategoriaServicio), Validators.required],
    activo: [this.servicio?.activo ?? true],
  });

  protected esEdicion(): boolean {
    return !!this.servicio;
  }

  protected guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const dto: CreateServicioDto = {
      nombre: v.nombre!.trim(),
      descripcion: v.descripcion?.trim() || null,
      duracionMin: v.duracionMin!,
      precio: v.precio!,
      categoria: v.categoria!,
      activo: v.activo ?? true,
    };
    this.guardando.set(true);
    const req = this.servicio
      ? this.serviciosSvc.update(this.servicio.id, dto)
      : this.serviciosSvc.create(dto);
    req.subscribe({
      next: (s) => this.dialogRef.close(s),
      error: (e) => {
        this.guardando.set(false);
        this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
      },
    });
  }
}