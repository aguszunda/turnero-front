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
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly mostrarPassword = signal(false);

  protected readonly cuentasDemo = [
    { rol: 'Administrador', email: 'admin@turnero.com', pass: 'admin123' },
    { rol: 'Recepcionista', email: 'recepcion@turnero.com', pass: 'recepcion123' },
    { rol: 'Profesional', email: 'juan@turnero.com', pass: 'prof123' },
    { rol: 'Cliente', email: 'ana@cliente.com', pass: 'cliente123' },
  ];

  protected autocompletar(email: string, pass: string): void {
    this.form.patchValue({ email, password: pass });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (e: unknown) => {
        this.loading.set(false);
        this.snackbar.open(ApiErrorHandler.message(e), 'Cerrar', { duration: 4000 });
      },
    });
  }
}