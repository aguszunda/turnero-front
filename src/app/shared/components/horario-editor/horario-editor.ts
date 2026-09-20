import { Component, effect, output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { HorarioSemanal } from '@app/core/models';
import { nombreDia } from '@app/core/services/disponibilidad.util';

const DIAS = [1, 2, 3, 4, 5, 6, 0];

@Component({
  selector: 'app-horario-editor',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './horario-editor.html',
  styleUrl: './horario-editor.scss',
})
export class HorarioEditor {
  readonly profesionalId = input(0);
  readonly horarios = input<HorarioSemanal[]>([]);
  readonly cambio = output<HorarioSemanal[]>();

  protected readonly dias = DIAS;
  protected readonly nombreDia = nombreDia;

  protected readonly model = signal<HorarioSemanal[]>([]);

  constructor() {
    effect(() => {
      this.model.set(this.horarios().map((h) => ({ ...h })));
    });
  }

  protected valueDelEvento(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected margenDelEvento(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  protected horarioDe(dia: number): HorarioSemanal | undefined {
    return this.model().find((h) => h.diaSemana === dia);
  }

  protected activo(dia: number): boolean {
    return !!this.horarioDe(dia);
  }

  protected toggleDia(dia: number): void {
    const lista = this.model();
    const idx = lista.findIndex((h) => h.diaSemana === dia);
    if (idx >= 0) {
      const nueva = lista.filter((_, i) => i !== idx);
      this.model.set(nueva);
    } else {
      this.model.set([
        ...lista,
        {
          id: 0,
          profesionalId: this.profesionalId(),
          diaSemana: dia,
          horaInicio: '09:00',
          horaFin: '18:00',
          inicioDescanso: '13:00',
          finDescanso: '14:00',
          margenMin: 10,
        },
      ]);
    }
    this.cambio.emit(this.model());
  }

  protected actualizar(dia: number, campo: keyof HorarioSemanal, valor: string | number): void {
    const lista = this.model();
    const idx = lista.findIndex((h) => h.diaSemana === dia);
    if (idx < 0) return;
    const actualizado = lista.map((h, i) =>
      i === idx ? ({ ...h, [campo]: typeof valor === 'string' && valor === '' ? null : valor }) : h,
    );
    this.model.set(actualizado);
    this.cambio.emit(this.model());
  }
}