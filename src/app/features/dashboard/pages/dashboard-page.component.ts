import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

import { AuthService } from '../../../core/services/auth.service';
import {
  MysqlAhorroService,
  DashboardReporte
} from '../../../core/services/mysql-ahorro.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent implements OnInit {
  private authService = inject(AuthService);
  private mysqlAhorroService = inject(MysqlAhorroService);

  loading = true;
  errorMessage = '';

  totalRegistros = 0;
  totalAhorrado = 0;
  metasCumplidas = 0;
  metasPendientes = 0;
  ultimoRegistro: string | null = null;

  barChartType: ChartType = 'bar';
  pieChartType: ChartType = 'pie';
  lineChartType: ChartType = 'line';

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Ahorro total'
      },
      {
        data: [],
        label: 'Meta'
      }
    ]
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Metas cumplidas', 'Metas pendientes'],
    datasets: [
      {
        data: [0, 0]
      }
    ]
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Ahorro total'
      }
    ]
  };

  async ngOnInit(): Promise<void> {
    await this.cargarDashboard();
  }

  async cargarDashboard(): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';

      const user = this.authService.currentUser;

      if (!user) {
        this.errorMessage = 'No hay usuario autenticado.';
        return;
      }

      const reporte: DashboardReporte =
        await this.mysqlAhorroService.obtenerReporteDashboard(user.uid);

      this.totalRegistros = Number(reporte.resumen.total_registros || 0);
      this.totalAhorrado = Number(reporte.resumen.total_ahorrado || 0);
      this.metasCumplidas = Number(reporte.resumen.metas_cumplidas || 0);
      this.metasPendientes = Number(reporte.resumen.metas_pendientes || 0);
      this.ultimoRegistro = reporte.resumen.ultimo_registro;

      this.barChartData = {
        labels: reporte.detalle.map(item => item.nombre),
        datasets: [
          {
            data: reporte.detalle.map(item => Number(item.ahorro_total || 0)),
            label: 'Ahorro total'
          },
          {
            data: reporte.detalle.map(item => Number(item.meta || 0)),
            label: 'Meta'
          }
        ]
      };

      this.pieChartData = {
        labels: ['Metas cumplidas', 'Metas pendientes'],
        datasets: [
          {
            data: [this.metasCumplidas, this.metasPendientes]
          }
        ]
      };

      this.lineChartData = {
        labels: reporte.detalle.map(item => item.nombre),
        datasets: [
          {
            data: reporte.detalle.map(item => Number(item.ahorro_total || 0)),
            label: 'Crecimiento de ahorros'
          }
        ]
      };
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      this.errorMessage = 'No fue posible cargar el dashboard.';
    } finally {
      this.loading = false;
    }
  }
}