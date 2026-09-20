import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface CancelarDialogData {
  razones: string[];
}

@Component({
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './cancelar-dialog.html',
})
export class CancelarDialogComponent {
  private fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<CancelarDialogComponent>);

  protected readonly razones = ['Cambio de planes', 'Problema de salud', 'Selección por error', 'Motivo económico', 'Otro'];

  protected readonly form = this.fb.group({
    motivo: ['', Validators.required],
    detalle: [''],
  });

  protected readonly guardando = signal(false);

  protected confirmar(): void {
    if (this.form.invalid) return;
    const { motivo, detalle } = this.form.getRawValue();
    const texto = [motivo, detalle].filter(Boolean).join(' — ');
    this.guardando.set(true);
    this.dialogRef.close(texto as string);
  }
}