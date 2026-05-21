import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { MysqlAhorroService } from './core/services/mysql-ahorro.service';
import { ExchangeService } from './services/exchange.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly mysqlAhorroService = inject(MysqlAhorroService);
  private readonly exchange = inject(ExchangeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();

  readonly user$ = this.authService.user$;

  totalAhorro = 0;
  totalAhorroUSD: number | null = null;
  tasaCOP: number | null = null;

  ngOnInit(): void {
    this.cargarDolar();

    this.subscriptions.add(
      this.authService.user$.subscribe(async (user) => {
        if (!user) {
          this.totalAhorro = 0;
          this.totalAhorroUSD = null;
          this.cdr.detectChanges();
          return;
        }

        await this.cargarResumen(user.uid);
      }),
    );

    this.subscriptions.add(
      this.mysqlAhorroService.ahorroActualizado$.subscribe(async () => {
        const user = this.authService.currentUser;

        if (user) {
          await this.cargarResumen(user.uid);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async cargarResumen(uid: string): Promise<void> {
    try {
      const reporte = await this.mysqlAhorroService.obtenerReporteDashboard(uid);
      this.totalAhorro = Number(reporte.resumen.total_ahorrado || 0);
      this.calcularConversion();
    } catch (error) {
      console.error('Error al cargar resumen principal:', error);
      this.totalAhorro = 0;
      this.totalAhorroUSD = null;
    } finally {
      this.cdr.detectChanges();
    }
  }

  cargarDolar(): void {
    this.exchange.getMoneda().subscribe({
      next: (data: any) => {
        this.tasaCOP = data?.rates?.COP ?? null;
        this.calcularConversion();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener moneda:', error);
      },
    });
  }

  calcularConversion(): void {
    this.totalAhorroUSD =
      this.tasaCOP && this.tasaCOP > 0 ? this.totalAhorro / this.tasaCOP : null;
  }

  async login(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesion:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  }
}
