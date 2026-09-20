import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import type { HorarioSemanal, Profesional, Servicio } from '@app/core/models';
import { HorariosService } from '@app/core/services/horarios.service';
import { ProfesionalesService } from '@app/core/services/profesionales.service';
import { ServiciosService } from '@app/core/services/servicios.service';
import { HorarioEditor } from '@app/shared/components/horario-editor/horario-editor';

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    HorarioEditor,
  ],
  templateUrl: './profesional-form-dialog.html',
  styleUrl: './profesional-form-dialog.scss',
})
export class ProfesionalFormDialog {
  private fb = inject(FormBuilder);
  private profesionalesSvc = inject(ProfesionalesService);
  private serviciosSvc = inject(ServiciosService);
  private horariosSvc = inject(HorariosService);
  private snackbar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialogRef<ProfesionalFormDialog>);
  protected readonly profesional: Profesional | null = inject(MAT_DIALOG_DATA);

  protected readonly cargandoServicios = signal(true);
  protected readonly guardando = signal(false);
  protected readonly servicios = signal<Servicio[]>([]);
  protected readonly horarios = signal<HorarioSemanal[]>([]);

  protected readonly form = this.fb.group({
    nombre: [this.profesional?.nombre ?? '', Validators.required],
    apellido: [this.profesional?.apellido ?? '', Validators.required],
    email: [this.profesional?.email ?? '', [Validators.required, Validators.email]],
    telefono: [this.profesional?.telefono ?? '', [Validators.required]],
    especialidad: [this.profesional?.especialidad ?? ''],
    bio: [this.profesional?.bio ?? ''],
    servicioIds: [this.profesional?.servicios.map((s) => s.id) ?? [], [Validators.required]],
  });

  protected readonly esEdicion = !!this.profesional;

  constructor() {
    void this.cargarContexto();
  }

  private async cargarContexto(): Promise<void> {
    try {
      this.servicios.set(await firstValueFrom(this.serviciosSvc.list(true)));
      if (this.profesional) {
        this.horarios.set(await firstValueFrom(this.horariosSvc.list(this.profesional.id)));
      }
    } catch (e) {
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargandoServicios.set(false);
    }
  }

  protected onHorariosCambio(h: HorarioSemanal[]): void {
    this.horarios.set(h);
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const base = {
      nombre: v.nombre!.trim(),
      apellido: v.apellido!.trim(),
      email: v.email!.trim(),
      telefono: v.telefono!.trim(),
      especialidad: v.especialidad?.trim() || null,
      bio: v.bio?.trim() || null,
      servicioIds: v.servicioIds ?? [],
    };

    this.guardando.set(true);
    try {
      const profesional = this.profesional
        ? await firstValueFrom(this.profesionalesSvc.update(this.profesional.id, base))
        : await firstValueFrom(this.profesionalesSvc.create(base));

      const yaPersistidos = new Set(this.profesional ? (await firstValueFrom(this.horariosSvc.list(this.profesional.id))).map((h) => h.id) : []);
      for (const h of this.horarios()) {
        const dto = {
          profesionalId: profesional.id,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          inicioDescanso: h.inicioDescanso,
          finDescanso: h.finDescanso,
          margenMin: h.margenMin,
        };
        await firstValueFrom(this.horariosSvc.upsert(dto));
        if (h.id) yaPersistidos.delete(h.id);
      }
      for (const id of yaPersistidos) {
        await firstValueFrom(this.horariosSvc.delete(id));
      }

      this.dialogRef.close(profesional);
    } catch (e) {
      this.guardando.set(false);
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    }
  }
}