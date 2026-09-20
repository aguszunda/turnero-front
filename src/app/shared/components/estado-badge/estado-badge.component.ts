import { Component, computed, input } from '@angular/core';
import { ESTADOS_TURNO, ESTADOS_TURNO_COLOR, type EstadoTurno } from '@app/core/models';

@Component({
  selector: 'app-estado-badge',
  styleUrl: './estado-badge.component.scss',
  templateUrl: './estado-badge.component.html',
})
export class EstadoBadgeComponent {
  readonly estado = input.required<EstadoTurno>();

  protected readonly label = computed(() => ESTADOS_TURNO[this.estado()]);
  protected readonly color = computed(() => ESTADOS_TURNO_COLOR[this.estado()]);
}