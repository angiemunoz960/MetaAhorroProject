import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, firstValueFrom } from 'rxjs';

export interface AhorroRecordMysql {
  id?: string | number;
  _id?: string;

  uid: string;
  displayName: string;
  email: string;

  nombreAhorro: string;
  descripcionAhorro: string;

  ahorroMensual: number;
  meses: number;
  meta: number;

  ahorroTotal: number;
  cumplioMeta: boolean;
  diferenciaMeta: number;

  createdAt?: string;
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
  detalle: AhorroRecordMysql[];
}

@Injectable({
  providedIn: 'root',
})
export class MysqlAhorroService {
  private readonly http = inject(HttpClient);

 private readonly apiBaseUrl =
  'https://metaahorro-backend.onrender.com/api/ahorros';

  private readonly ahorroActualizadoSubject = new Subject<void>();

  readonly ahorroActualizado$ =
    this.ahorroActualizadoSubject.asObservable();

  async crearAhorro(data: AhorroRecordMysql): Promise<any> {
    const response = await firstValueFrom(
      this.http.post<AhorroRecordMysql>(this.apiBaseUrl, data)
    );

    this.ahorroActualizadoSubject.next();

    return response;
  }

  async obtenerAhorros(uid: string): Promise<AhorroRecordMysql[]> {
    const response = await firstValueFrom(
      this.http.get<AhorroRecordMysql[]>(
        `${this.apiBaseUrl}/${uid}`
      )
    );

    return (response ?? []).map((ahorro) => ({
      ...ahorro,
      id: ahorro._id ?? ahorro.id,
    }));
  }

  async obtenerReporteDashboard(
    uid: string
  ): Promise<DashboardReporte> {
    const response = await firstValueFrom(
      this.http.get<DashboardReporte>(
        `${this.apiBaseUrl}/reporte/resumen/${uid}`
      )
    );

    return {
      ...response,
      detalle: response.detalle.map((ahorro) => ({
        ...ahorro,
        id: ahorro._id ?? ahorro.id,
      })),
    };
  }

  async actualizarAhorro(
    data: AhorroRecordMysql
  ): Promise<any> {
    const mongoId = data._id ?? data.id;

    const response = await firstValueFrom(
      this.http.put(
        `${this.apiBaseUrl}/${mongoId}`,
        data
      )
    );

    this.ahorroActualizadoSubject.next();

    return response;
  }

 async eliminarAhorro(
  id: string | number,
  _uid?: string
): Promise<any> {
  const response = await firstValueFrom(
    this.http.delete(
      `${this.apiBaseUrl}/${id}`
    )
  );

  this.ahorroActualizadoSubject.next();

  return response;
}
}