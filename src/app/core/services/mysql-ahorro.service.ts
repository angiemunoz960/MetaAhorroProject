import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AhorroMysql {
  id?: number;
  uid: string;
  nombre: string;
  descripcion: string;
  ahorro_mensual: number;
  meses: number;
  meta: number;
  ahorro_total?: number;
  cumplio_meta?: boolean;
  diferencia_meta?: number;
  created_at?: string;
}

export interface DashboardResumen {
  total_registros: number;
  total_ahorrado: number;
  metas_cumplidas: number;
  metas_pendientes: number;
  ultimo_registro: string | null;
}

export interface DashboardReporte {
  resumen: DashboardResumen;
  detalle: AhorroMysql[];
}

@Injectable({
  providedIn: 'root',
})
export class MysqlAhorroService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/ahorros';

  async crearAhorro(data: AhorroMysql): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl, data));
  }

  async obtenerAhorros(uid: string): Promise<AhorroMysql[]> {
    return await firstValueFrom(
      this.http.get<AhorroMysql[]>(`${this.apiUrl}/${uid}`)
    );
  }

  async obtenerReporteDashboard(uid: string): Promise<DashboardReporte> {
    return await firstValueFrom(
      this.http.get<DashboardReporte>(`${this.apiUrl}/reporte/resumen/${uid}`)
    );
  }

  async actualizarAhorro(id: number, data: AhorroMysql): Promise<any> {
    return await firstValueFrom(
      this.http.put(`${this.apiUrl}/${id}`, data)
    );
  }

  async eliminarAhorro(id: number): Promise<any> {
    return await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`)
    );
  }
}
