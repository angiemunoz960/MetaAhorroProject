import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import {
  DashboardReporte,
  MysqlAhorroService,
} from '../../../core/services/mysql-ahorro.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly mysqlAhorroService = inject(MysqlAhorroService);
  private readonly subscriptions = new Subscription();

  loading = true;
  errorMessage = '';

  totalRegistros = 0;
  totalAhorrado = 0;
  metasCumplidas = 0;
  metasPendientes = 0;
  ultimoRegistro: string | null = null;

  barChartType: ChartType = 'bar';
  pieChartType: ChartType = 'pie';

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Ahorro total',
      },
      {
        data: [],
        label: 'Meta',
      },
    ],
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Metas cumplidas', 'Metas pendientes'],
    datasets: [
      {
        data: [0, 0],
      },
    ],
  };

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe(async (user) => {
        if (!user) {
          this.limpiarDashboard();
          this.errorMessage = 'No hay usuario autenticado.';
          this.loading = false;
          return;
        }

        await this.cargarDashboard(user.uid);
      }),
    );

    this.subscriptions.add(
      this.mysqlAhorroService.ahorroActualizado$.subscribe(async () => {
        const user = this.authService.currentUser;

        if (user) {
          await this.cargarDashboard(user.uid);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async cargarDashboard(uid: string): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';

      const reporte = await this.mysqlAhorroService.obtenerReporteDashboard(uid);
      this.aplicarReporte(reporte);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      this.limpiarDashboard();
      this.errorMessage = 'No fue posible cargar el dashboard.';
    } finally {
      this.loading = false;
    }
  }

  private aplicarReporte(reporte: DashboardReporte): void {
    this.totalRegistros = Number(reporte.resumen.total_registros || 0);
    this.totalAhorrado = Number(reporte.resumen.total_ahorrado || 0);
    this.metasCumplidas = Number(reporte.resumen.metas_cumplidas || 0);
    this.metasPendientes = Number(reporte.resumen.metas_pendientes || 0);
    this.ultimoRegistro = reporte.resumen.ultimo_registro;

    this.barChartData = {
      labels: reporte.detalle.map((item) => item.nombreAhorro),
      datasets: [
        {
          data: reporte.detalle.map((item) => Number(item.ahorroTotal || 0)),
          label: 'Ahorro total',
        },
        {
          data: reporte.detalle.map((item) => Number(item.meta || 0)),
          label: 'Meta',
        },
      ],
    };

    this.pieChartData = {
      labels: ['Metas cumplidas', 'Metas pendientes'],
      datasets: [
        {
          data: [this.metasCumplidas, this.metasPendientes],
        },
      ],
    };
  }

  private limpiarDashboard(): void {
    this.totalRegistros = 0;
    this.totalAhorrado = 0;
    this.metasCumplidas = 0;
    this.metasPendientes = 0;
    this.ultimoRegistro = null;
    this.barChartData = {
      labels: [],
      datasets: [
        { data: [], label: 'Ahorro total' },
        { data: [], label: 'Meta' },
      ],
    };
    this.pieChartData = {
      labels: ['Metas cumplidas', 'Metas pendientes'],
      datasets: [{ data: [0, 0] }],
    };
  }
}
