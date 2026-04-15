import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  constructor(private http: HttpClient) {}

  getMoneda(){
    return this.http.get('https://api.exchangerate-api.com/v4/latest/USD');
  }

}
