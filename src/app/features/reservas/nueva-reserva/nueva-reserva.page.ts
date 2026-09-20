import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '@env/environment';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import { ESTADOS_TURNO, type Profesional, type Servicio, type TurnoDetalle } from '@app/core/models';
import { AuthService } from '@app/core/services/auth.service';
import { ClientesService } from '@app/core/services/clientes.service';
import { DisponibilidadService } from '@app/core/services/disponibilidad.service';
import type { ResultadoDisponibilidad, SlotDisponible } from '@app/core/services/disponibilidad.util';
import { ProfesionalesService } from '@app/core/services/profesionales.service';
import { ServiciosService } from '@app/core/services/servicios.service';
import { TurnosService } from '@app/core/services/turnos.service';
import { isoFromLocal } from '@app/core/utils/date-time';
import { EstadoBadgeComponent } from '@app/shared/components/estado-badge/estado-badge.component';

type ModoProfesional = 'primero' | number;

@Component({
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTooltipModule,
    MatDividerModule,
    EstadoBadgeComponent,
  ],
  templateUrl: './nueva-reserva.page.html',
  styleUrl: './nueva-reserva.page.scss',
})
export class NuevaReservaPage {
  private serviciosSvc = inject(ServiciosService);
  private profesionalesSvc = inject(ProfesionalesService);
  private disponibilidadSvc = inject(DisponibilidadService);
  private turnosSvc = inject(TurnosService);
  private clientesSvc = inject(ClientesService);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);

  // ---- Datos base ----
  protected readonly cargando = signal(true);
  protected readonly servicios = signal<Servicio[]>([]);
  protected readonly profesionales = signal<Profesional[]>([]);
  protected readonly clientes = signal<{ id: number; nombre: string }[]>([]);
  protected readonly esGestor = signal(this.auth.esAdminORecepcion());

  // ---- Selección ----
  protected readonly servicioId = signal<number | null>(null);
  protected readonly modoProfesional = signal<ModoProfesional>('primero');
  protected readonly fechaDate = signal<Date | null>(null);
  protected readonly resultado = signal<ResultadoDisponibilidad | null>(null);
  protected readonly horaSeleccionada = signal<string | null>(null);
  protected readonly clienteSeleccionadoId = signal<number | null>(null);

  protected readonly turnoCreado = signal<TurnoDetalle | null>(null);
  protected readonly creando = signal(false);

  protected readonly cargandoDias = signal(false);
  protected readonly cargandoSlots = signal(false);
  protected readonly diasDisponibles = signal<Set<string>>(new Set());

  /** Clave "YYYY-MM-DD" derivada del Date elegido. */
  protected readonly fecha = computed(() =>
    this.fechaDate() ? toKeyDate(this.fechaDate()!) : null,
  );

  // ---- Fechas del datepicker (ventana de 60 días) ----
  protected readonly minFecha = new Date();
  protected readonly maxFecha = new Date(Date.now() + 60 * 86_400_000);

  protected readonly servicio = computed(() =>
    this.servicios().find((s) => s.id === this.servicioId()) ?? null,
  );
  protected readonly profesionalesCapaces = computed(() => {
    const sid = this.servicioId();
    if (sid === null) return [];
    return this.profesionales().filter((p) => p.servicios.some((s) => s.id === sid));
  });
  protected readonly profesionalElegido = computed(() => {
    const modo = this.modoProfesional();
    return typeof modo === 'number' ? this.profesionales().find((p) => p.id === modo) ?? null : null;
  });

  protected readonly paso1Completo = computed(() => this.servicioId() !== null);
  protected readonly paso2Completo = computed(() => this.servicioId() !== null && this.fecha() !== null);
  protected readonly paso3Completo = computed(() => this.horaSeleccionada() !== null);
  protected readonly paso4Completo = computed(
    () =>
      this.paso3Completo() &&
      (this.esGestor() ? this.clienteSeleccionadoId() !== null : this.auth.clienteId() !== null),
  );

  protected readonly slotElegido = computed<SlotDisponible | null>(() => {
    const hora = this.horaSeleccionada();
    if (!hora) return null;
    return this.resultado()?.slots.find((s) => s.horaInicio === hora) ?? null;
  });

  constructor() {
    void this.cargarDatosIniciales();
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      const [svc, prof, cli] = await Promise.all([
        firstValueFrom(this.serviciosSvc.list(true)),
        firstValueFrom(this.profesionalesSvc.list(true)),
        this.esGestor() ? firstValueFrom(this.clientesSvc.list()) : Promise.resolve([]),
      ]);
      this.servicios.set(svc);
      this.profesionales.set(prof);
      this.clientes.set(cli.map((c) => ({ id: c.id, nombre: `${c.nombre} ${c.apellido}` })));
    } catch (e) {
      this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
    } finally {
      this.cargando.set(false);
    }
  }

  protected onServicioSeleccionado(): void {
    this.modoProfesional.set('primero');
    this.fechaDate.set(null);
    this.resultado.set(null);
    this.horaSeleccionada.set(null);
  }

  protected onModoOProfesionalCambio(): void {
    this.fechaDate.set(null);
    this.resultado.set(null);
    this.horaSeleccionada.set(null);
  }

  /** Al entrar en el paso de fecha, precarga los días con disponibilidad. */
  protected onStepperCambio(event: { selectedIndex: number }): void {
    if (event.selectedIndex === 1) this.cargarDiasDisponibles();
  }

  protected cargarDiasDisponibles(): void {
    const sid = this.servicioId();
    if (sid === null || this.cargandoDias()) return;
    this.cargandoDias.set(true);
    const hoy = new Date();
    const prof = typeof this.modoProfesional() === 'number' ? (this.modoProfesional() as number) : undefined;
    this.disponibilidadSvc.consultarDiasDisponibles(sid, hoy.getFullYear(), hoy.getMonth(), prof).subscribe({
      next: (dias) => {
        this.diasDisponibles.set(new Set(dias));
        this.cargandoDias.set(false);
      },
      error: () => this.cargandoDias.set(false),
    });
  }

  protected filtrarFecha = (d: Date | null): boolean => (d ? this.diasDisponibles().has(toKeyDate(d)) : false);

  protected onFechaCambio(): void {
    const fecha = this.fecha();
    const sid = this.servicioId();
    if (!fecha || sid === null) return;
    this.horaSeleccionada.set(null);
    this.cargandoSlots.set(true);
    const prof = this.modoProfesional() === 'primero' ? undefined : (this.modoProfesional() as number);
    this.disponibilidadSvc.consultar({ servicioId: sid, profesionalId: prof, fecha }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.cargandoSlots.set(false);
      },
      error: (e) => {
        this.cargandoSlots.set(false);
        this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
      },
    });
  }

  protected nombresDe(ids: number[]): string {
    return ids
      .map((id) => {
        const p = this.profesionales().find((x) => x.id === id);
        return p ? `${p.nombre} ${p.apellido}` : `#${id}`;
      })
      .join(', ');
  }

  protected confirmarTurno(): void {
    const fecha = this.fecha();
    const hora = this.horaSeleccionada();
    const sid = this.servicioId();
    const slot = this.slotElegido();
    if (!fecha || !hora || sid === null || !slot) return;

    const profesionalId = this.profesionalIdDelSlot(slot);
    const clienteId = this.esGestor() ? (this.clienteSeleccionadoId() ?? 0) : (this.auth.clienteId() ?? 0);
    if (!profesionalId || !clienteId) {
      this.snackbar.open('Faltan datos del cliente o profesional', 'Cerrar', { duration: 4000 });
      return;
    }

    this.creando.set(true);
    this.turnosSvc
      .create({
        clienteId,
        profesionalId,
        servicioId: sid,
        fechaHoraInicio: isoFromLocal(fecha, hora),
        estado: environment.confirmacionAutomatica ? 'reservado' : 'pendiente',
        creadoPor: this.esGestor() ? 'RECEPCIONISTA' : 'CLIENTE',
      })
      .subscribe({
        next: (t) => {
          this.turnoCreado.set(t as TurnoDetalle);
          this.creando.set(false);
        },
        error: (e) => {
          this.creando.set(false);
          this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 5000 });
        },
      });
  }

  private profesionalIdDelSlot(slot: SlotDisponible): number | null {
    const modo = this.modoProfesional();
    if (typeof modo === 'number') {
      return slot.profesionales.includes(modo) ? modo : null;
    }
    return slot.profesionales[0] ?? null;
  }

  protected reiniciar(): void {
    this.turnoCreado.set(null);
    this.servicioId.set(null);
    this.modoProfesional.set('primero');
    this.fechaDate.set(null);
    this.resultado.set(null);
    this.horaSeleccionada.set(null);
    this.clienteSeleccionadoId.set(null);
  }

  protected readonly estadoLabel = ESTADOS_TURNO;
}

function toKeyDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}