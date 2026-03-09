import { Component, OnDestroy, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AhorroService } from '../../../core/services/ahorro.service';
import { AhorroRecord } from '../../../core/models/ahorro-record.model';

@Component({
  selector: 'app-ahorro-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ahorro-page.component.html',
  styleUrl: './ahorro-page.component.css',
})
export class AhorroPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private ahorroService = inject(AhorroService);
  private ngZone = inject(NgZone);

  private subscriptions = new Subscription();

  ahorroForm!: FormGroup;
  loading = false;
  loadingAhorros = true;
  successMessage = '';
  errorMessage = '';

  ahorros: AhorroRecord[] = [];

  constructor() {
    this.ahorroForm = this.fb.group({
      nombreAhorro: ['', [Validators.required, Validators.minLength(3)]],
      descripcionAhorro: ['', [Validators.required, Validators.minLength(5)]],
      ahorroMensual: [null, [Validators.required, Validators.min(1)]],
      meses: [null, [Validators.required, Validators.min(1)]],
      meta: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    const authInitSub = this.authService.authInitialized$.subscribe(async (initialized) => {
      if (!initialized) {
        return;
      }

      const user = this.authService.currentUser;

      if (!user) {
        this.ngZone.run(() => {
          this.ahorros = [];
          this.loadingAhorros = false;
        });
        return;
      }

      await this.cargarAhorros();
    });

    this.subscriptions.add(authInitSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async onSubmit(): Promise<void> {
    this.ngZone.run(() => {
      this.successMessage = '';
      this.errorMessage = '';
    });

    if (this.ahorroForm.invalid) {
      this.ahorroForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser;

    if (!user) {
      this.ngZone.run(() => {
        this.errorMessage = 'Debes iniciar sesión para guardar un ahorro.';
      });
      return;
    }

    try {
      this.ngZone.run(() => {
        this.loading = true;
      });

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

      this.ngZone.run(() => {
        this.successMessage = 'Ahorro guardado correctamente.';
        this.ahorroForm.reset({
          nombreAhorro: '',
          descripcionAhorro: '',
          ahorroMensual: null,
          meses: null,
          meta: null,
        });
      });

      await this.cargarAhorros();
    } catch (error) {
      console.error('Error al guardar ahorro:', error);
      this.ngZone.run(() => {
        this.errorMessage = 'Ocurrió un error al guardar el ahorro.';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  async cargarAhorros(): Promise<void> {
    const user = this.authService.currentUser;

    if (!user) {
      this.ngZone.run(() => {
        this.ahorros = [];
        this.loadingAhorros = false;
      });
      return;
    }

    try {
      this.ngZone.run(() => {
        this.loadingAhorros = true;
        this.errorMessage = '';
      });

      const ahorros = await this.ahorroService.obtenerAhorrosPorUsuario(user.uid);

      this.ngZone.run(() => {
        this.ahorros = ahorros;
      });
    } catch (error) {
      console.error('Error al cargar ahorros:', error);
      this.ngZone.run(() => {
        this.ahorros = [];
        this.errorMessage = 'No fue posible cargar el historial de ahorros.';
      });
    } finally {
      this.ngZone.run(() => {
        this.loadingAhorros = false;
      });
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
