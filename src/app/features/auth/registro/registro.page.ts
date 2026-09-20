import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorHandler } from '@app/core/interceptors/error.interceptor';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './registro.page.html',
  styleUrl: './registro.page.scss',
})
export class RegistroPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);

  protected readonly form = this.fb.group(
    {
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+]?[0-9\s()-]{6,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: (g) => (g.get('password')?.value === g.get('confirmar')?.value ? null : { passwords: true }) },
  );

  protected readonly loading = signal(false);
  protected readonly mostrarPassword = signal(false);

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading.set(true);
    this.auth
      .register({
        nombre: v.nombre!,
        apellido: v.apellido!,
        email: v.email!,
        telefono: v.telefono!,
        password: v.password!,
      })
      .subscribe({
        next: () => {
          this.snackbar.open('Cuenta creada correctamente ✂️', 'Cerrar', { duration: 3000 });
          void this.router.navigate(['/']);
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
        },
      });
  }
}