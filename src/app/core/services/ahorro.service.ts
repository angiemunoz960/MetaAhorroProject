import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AhorroService {

  private apiUrl = 'https://metaahorro-backend.onrender.com';

  ahorroActualizado$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  obtenerAhorros(uid: string): Promise<any> {
    return this.http.get(this.apiUrl).toPromise();
  }

  crearAhorro(data: any): Promise<any> {
    return this.http.post(this.apiUrl, data).toPromise();
  }

  actualizarAhorro(data: any): Promise<any> {
    return this.http.put(`${this.apiUrl}/${data.id}`, data).toPromise();
  }

  eliminarAhorro(id: number, uid: string): Promise<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
  }

  obtenerReporteDashboard(uid: string): Promise<any> {
    return this.http.get(this.apiUrl).toPromise();
  }
}
