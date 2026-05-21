import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

import {
  AhorroRecordMysql,
  MysqlAhorroService,
} from '../../../core/services/mysql-ahorro.service';

@Component({
  selector: 'app-ahorro-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ahorro-page.component.html',
  styleUrl: './ahorro-page.component.css',
})
export class AhorroPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly mysqlAhorroService =
    inject(MysqlAhorroService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly subscriptions = new Subscription();

  @ViewChild('formularioAhorro')
  formularioAhorro!: ElementRef;

  modoEdicion = false;

  ahorroEditandoId: string | number | null = null;

  ahorroForm: FormGroup = this.fb.group({
    nombreAhorro: [
      '',
      [Validators.required, Validators.minLength(3)],
    ],

    descripcionAhorro: [
      '',
      [Validators.required, Validators.minLength(5)],
    ],

    ahorroMensual: [
      null,
      [Validators.required, Validators.min(1)],
    ],

    meses: [
      null,
      [Validators.required, Validators.min(1)],
    ],

    meta: [
      null,
      [Validators.required, Validators.min(1)],
    ],
  });

  loading = false;

  loadingAhorros = true;

  successMessage = '';

  errorMessage = '';

  ahorros: AhorroRecordMysql[] = [];

  analisis = {
  alcanzaraMeta: false,

  faltante: 0,

  ahorroNecesarioMensual: 0,

  diferenciaMensual: 0,

  simulacionExtra20: 0,

  simulacionExtra3Meses: 0,
};

  ngOnInit(): void {

    this.ahorroForm.valueChanges.subscribe(() => {
  this.calcularAnalisis();
});
    this.subscriptions.add(
      this.authService.user$.subscribe(async (user) => {
        if (!user) {
          this.ahorros = [];

          this.loadingAhorros = false;

          this.cdr.detectChanges();

          return;
        }

        await this.cargarAhorros();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async onSubmit(): Promise<void> {
    this.successMessage = '';

    this.errorMessage = '';

    if (this.ahorroForm.invalid) {
      this.ahorroForm.markAllAsTouched();

      return;
    }

    const user = this.authService.currentUser;

    if (!user?.uid || !user.email) {
      this.errorMessage =
        'Debes iniciar sesion para guardar un ahorro.';

      return;
    }

    this.loading = true;

    try {
      const ahorro = this.construirPayload(
        user.uid,
        user.displayName,
        user.email
      );

      if (
        this.modoEdicion &&
        this.ahorroEditandoId !== null
      ) {
        await this.mysqlAhorroService.actualizarAhorro({
          ...ahorro,
          id: this.ahorroEditandoId,
        });

        this.successMessage =
          'Ahorro actualizado correctamente.';

        this.cancelarEdicion(false);
      } else {
        await this.mysqlAhorroService.crearAhorro(
          ahorro
        );

        this.successMessage =
          'Ahorro guardado correctamente.';

        this.resetFormulario();
      }

      await this.cargarAhorros();
    } catch (error) {
      console.error(
        'Error al guardar el ahorro:',
        error
      );

      this.errorMessage =
        'Ocurrio un error al procesar el ahorro.';
    } finally {
      this.loading = false;

      this.cdr.detectChanges();
    }
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

      this.ahorros =
        await this.mysqlAhorroService.obtenerAhorros(
          user.uid
        );
    } catch (error) {
      console.error(
        'Error al cargar ahorros:',
        error
      );

      this.ahorros = [];

      this.errorMessage =
        'No fue posible cargar el historial de ahorros.';
    } finally {
      this.loadingAhorros = false;

      this.cdr.detectChanges();
    }
  }

  editarAhorro(
    ahorro: AhorroRecordMysql
  ): void {
    this.modoEdicion = true;

    this.ahorroEditandoId = String(
      ahorro.id ?? ''
    );

    this.successMessage = '';

    this.errorMessage = '';

    this.ahorroForm.patchValue({
      nombreAhorro: ahorro.nombreAhorro,

      descripcionAhorro:
        ahorro.descripcionAhorro,

      ahorroMensual: ahorro.ahorroMensual,

      meses: ahorro.meses,

      meta: ahorro.meta,
    });

    this.scrollAlFormulario();
  }

  cancelarEdicion(
    limpiarMensajes = true
  ): void {
    this.modoEdicion = false;

    this.ahorroEditandoId = null;

    if (limpiarMensajes) {
      this.successMessage = '';

      this.errorMessage = '';
    }

    this.resetFormulario();
  }

  async eliminarAhorro(
    ahorro: AhorroRecordMysql
  ): Promise<void> {
    if (!ahorro.id) {
      this.errorMessage =
        'No se pudo identificar el ahorro a eliminar.';

      return;
    }

    const confirmado = window.confirm(
      `Seguro que deseas eliminar el ahorro "${ahorro.nombreAhorro}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      this.loading = true;

      this.successMessage = '';

      this.errorMessage = '';

      await this.mysqlAhorroService.eliminarAhorro(
        ahorro.id
      );

      if (
        this.modoEdicion &&
        this.ahorroEditandoId === ahorro.id
      ) {
        this.cancelarEdicion();
      }

      this.successMessage =
        'Ahorro eliminado correctamente.';

      await this.cargarAhorros();
    } catch (error) {
      console.error(
        'Error al eliminar ahorro:',
        error
      );

      this.errorMessage =
        'Ocurrio un error al eliminar el ahorro.';
    } finally {
      this.loading = false;

      this.cdr.detectChanges();
    }
  }

  scrollAlFormulario(): void {
    if (this.formularioAhorro) {
      this.formularioAhorro.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  calcularAnalisis(): void {
  const ahorroMensual = Number(
    this.ahorroForm.value.ahorroMensual
  );

  const meses = Number(
    this.ahorroForm.value.meses
  );

  const meta = Number(
    this.ahorroForm.value.meta
  );

  if (
    !ahorroMensual ||
    !meses ||
    !meta
  ) {
    return;
  }

  const ahorroTotal =
    ahorroMensual * meses;

  this.analisis.alcanzaraMeta =
    ahorroTotal >= meta;

  this.analisis.faltante =
    Math.max(meta - ahorroTotal, 0);

  this.analisis.ahorroNecesarioMensual =
    meta / meses;

  this.analisis.diferenciaMensual =
    Math.max(
      this.analisis.ahorroNecesarioMensual -
        ahorroMensual,
      0
    );

const ahorroConAumento10 =
ahorroMensual * 1.1;

this.analisis.simulacionExtra20 =
  ahorroConAumento10 * meses;

  this.analisis.simulacionExtra3Meses =
    ahorroMensual * (meses + 3);
}

  private construirPayload(
    uid: string,
    displayName: string | null,
    email: string
  ): AhorroRecordMysql {
    const nombreAhorro = String(
      this.ahorroForm.value.nombreAhorro
    ).trim();

    const descripcionAhorro = String(
      this.ahorroForm.value.descripcionAhorro
    ).trim();

    const ahorroMensual = Number(
      this.ahorroForm.value.ahorroMensual
    );

    const meses = Number(
      this.ahorroForm.value.meses
    );

    const meta = Number(
      this.ahorroForm.value.meta
    );

    const ahorroTotal =
      ahorroMensual * meses;

    return {
      uid,

      displayName:
        displayName?.trim() ||
        'Usuario sin nombre',

      email,

      nombreAhorro,

      descripcionAhorro,

      ahorroMensual,

      meses,

      meta,

      ahorroTotal,

      cumplioMeta:
        ahorroTotal >= meta,

      diferenciaMeta:
        ahorroTotal - meta,
    };
  }

  private resetFormulario(): void {
    this.ahorroForm.reset({
      nombreAhorro: '',

      descripcionAhorro: '',

      ahorroMensual: null,

      meses: null,

      meta: null,
    });
  }

  get nombreAhorroControl() {
    return this.ahorroForm.get(
      'nombreAhorro'
    );
  }

  get descripcionAhorroControl() {
    return this.ahorroForm.get(
      'descripcionAhorro'
    );
  }

  get ahorroMensualControl() {
    return this.ahorroForm.get(
      'ahorroMensual'
    );
  }

  get mesesControl() {
    return this.ahorroForm.get(
      'meses'
    );
  }

  get metaControl() {
    return this.ahorroForm.get(
      'meta'
    );
  }
}
