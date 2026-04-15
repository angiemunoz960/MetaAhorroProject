import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ExchangeService } from './services/exchange.service';
import { AhorroService } from './core/services/ahorro.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private authService = inject(AuthService);
  private exchange = inject(ExchangeService);
  private ahorroService = inject(AhorroService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  user$ = this.authService.user$;

  ahorros: any[] = [];
  totalAhorro = 0;
  totalAhorroUSD: number | null = null;

  monedas: any = null;
  tasaCOP: number | null = null;

  ngOnInit() {
    this.cargarDolar();

    this.authService.authInitialized$.subscribe(async (initialized) => {
      this.ngZone.run(async () => {
        if (!initialized) {
          return;
        }

        const user = this.authService.currentUser;

        if (!user) {
          this.ahorros = [];
          this.totalAhorro = 0;
          this.totalAhorroUSD = null;
          this.cdr.detectChanges();
          return;
        }

        await this.cargarResumen(user.uid);
      });
    });
  }

  async cargarResumen(uid: string) {
    try {
      const datos = await this.ahorroService.obtenerAhorrosPorUsuario(uid);

      this.ngZone.run(() => {
        this.ahorros = datos;

        this.totalAhorro = this.ahorros.reduce((total, a) => {
          return total + Number(a.ahorroTotal || 0);
        }, 0);

        this.calcularConversion();
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error al cargar resumen:', error);

      this.ngZone.run(() => {
        this.ahorros = [];
        this.totalAhorro = 0;
        this.totalAhorroUSD = null;
        this.cdr.detectChanges();
      });
    }
  }

  cargarDolar() {
    this.exchange.getMoneda().subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.monedas = data;
          this.tasaCOP = data?.rates?.COP ?? null;
          this.calcularConversion();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al obtener moneda:', error);
      }
    });
  }

  calcularConversion() {
    if (this.tasaCOP !== null) {
      this.totalAhorroUSD = this.totalAhorro / this.tasaCOP;
    }
  }

  async login() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}