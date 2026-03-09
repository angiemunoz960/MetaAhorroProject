import { Component, OnDestroy, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AhorroService } from '../../../core/services/ahorro.service';
import { AhorroRecord } from '../../../core/models/ahorro-record.model';

import { ViewChild, ElementRef } from '@angular/core';

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

  @ViewChild('formularioAhorro')
  formularioAhorro!: ElementRef;

  modoEdicion = false;
  ahorroEditandoId: string | null = null;

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
      this.ngZone.run(async () => {
        if (!initialized) {
          return;
        }

        const user = this.authService.currentUser;

        if (!user) {
          this.ahorros = [];
          this.loadingAhorros = false;
          this.cdr.detectChanges();
          return;
        }

        await this.cargarAhorros();
      });
    });

    this.subscriptions.add(authInitSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cdr = inject(ChangeDetectorRef);

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

    this.ngZone.run(() => {
      this.loading = true;
    });

    try {
      const nombreAhorro = this.ahorroForm.value.nombreAhorro as string;
      const descripcionAhorro = this.ahorroForm.value.descripcionAhorro as string;
      const ahorroMensual = Number(this.ahorroForm.value.ahorroMensual);
      const meses = Number(this.ahorroForm.value.meses);
      const meta = Number(this.ahorroForm.value.meta);

      const ahorroTotal = ahorroMensual * meses;
      const cumplioMeta = ahorroTotal >= meta;
      const diferenciaMeta = ahorroTotal - meta;

      if (this.modoEdicion && this.ahorroEditandoId) {
        await this.ahorroService.actualizarAhorro(this.ahorroEditandoId, {
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
          this.successMessage = 'Ahorro actualizado correctamente.';
        });

        this.cancelarEdicion();
      } else {
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
      }
    } catch (error) {
      console.error('Error al guardar/actualizar ahorro:', error);
      this.ngZone.run(() => {
        this.errorMessage = 'Ocurrió un error al procesar el ahorro.';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
      });
    }

    await this.cargarAhorros();
  }

  async cargarAhorros(): Promise<void> {
    const user = this.authService.currentUser;

    if (!user) {
      this.ahorros = [];
      this.loadingAhorros = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      this.loadingAhorros = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const ahorros = await this.ahorroService.obtenerAhorrosPorUsuario(user.uid);

      this.ahorros = ahorros;
    } catch (error) {
      console.error('Error al cargar ahorros:', error);
      this.ahorros = [];
      this.errorMessage = 'No fue posible cargar el historial de ahorros.';
    } finally {
      this.loadingAhorros = false;
      this.cdr.detectChanges();
    }
  }

  editarAhorro(ahorro: AhorroRecord): void {
    this.modoEdicion = true;
    this.ahorroEditandoId = ahorro.id ?? null;

    this.successMessage = '';
    this.errorMessage = '';

    this.ahorroForm.patchValue({
      nombreAhorro: ahorro.nombreAhorro,
      descripcionAhorro: ahorro.descripcionAhorro,
      ahorroMensual: ahorro.ahorroMensual,
      meses: ahorro.meses,
      meta: ahorro.meta,
    });

    this.scrollAlFormulario();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.ahorroEditandoId = null;
    this.successMessage = '';
    this.errorMessage = '';

    this.ahorroForm.reset({
      nombreAhorro: '',
      descripcionAhorro: '',
      ahorroMensual: null,
      meses: null,
      meta: null,
    });
  }

  scrollAlFormulario(): void {
    if (this.formularioAhorro) {
      this.formularioAhorro.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
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
