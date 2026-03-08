import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AhorroService } from '../../../core/services/ahorro.service';

@Component({
  selector: 'app-ahorro-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ahorro-page.component.html',
  styleUrl: './ahorro-page.component.css',
})
export class AhorroPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private ahorroService = inject(AhorroService);

  ahorroForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.ahorroForm = this.fb.group({
      nombreAhorro: ['', [Validators.required, Validators.minLength(3)]],
      descripcionAhorro: ['', [Validators.required, Validators.minLength(5)]],
      ahorroMensual: [null, [Validators.required, Validators.min(1)]],
      meses: [null, [Validators.required, Validators.min(1)]],
      meta: [null, [Validators.required, Validators.min(1)]],
    });
  }

  async onSubmit(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.ahorroForm.invalid) {
      this.ahorroForm.markAllAsTouched();
      return;
    }

    try {
      this.loading = true;

      const user = await firstValueFrom(this.authService.user$);

      if (!user) {
        this.errorMessage = 'Debes iniciar sesión para guardar un ahorro.';
        return;
      }

      const nombreAhorro = this.ahorroForm.value.nombreAhorro as string;
      const descripcionAhorro = this.ahorroForm.value.descripcionAhorro as string;
      const ahorroMensual = Number(this.ahorroForm.value.ahorroMensual);
      const meses = Number(this.ahorroForm.value.meses);
      const meta = Number(this.ahorroForm.value.meta);

      const ahorroTotal = ahorroMensual * meses;
      const cumplioMeta = ahorroTotal >= meta;
      const diferenciaMeta = ahorroTotal - meta;

      await this.ahorroService.crearAhorro({
        uid: user.uid,
        displayName: user.displayName ?? 'Sin nombre',
        email: user.email ?? 'Sin correo',
        nombreAhorro,
        descripcionAhorro,
        ahorroMensual,
        meses,
        meta,
        ahorroTotal,
        cumplioMeta,
        diferenciaMeta,
      });

      this.successMessage = 'Ahorro guardado correctamente.';
      this.ahorroForm.reset();
    } catch (error) {
      console.error('Error al guardar ahorro:', error);
      this.errorMessage = 'Ocurrió un error al guardar el ahorro.';
    } finally {
      this.loading = false;
    }
  }

  get nombreAhorroControl() {
    return this.ahorroForm.get('nombreAhorro');
  }

  get descripcionAhorroControl() {
    return this.ahorroForm.get('descripcionAhorro');
  }

  get ahorroMensualControl() {
    return this.ahorroForm.get('ahorroMensual');
  }

  get mesesControl() {
    return this.ahorroForm.get('meses');
  }

  get metaControl() {
    return this.ahorroForm.get('meta');
  }
}
