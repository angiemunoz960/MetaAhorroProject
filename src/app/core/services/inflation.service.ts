import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface InflationRecord {
  year: string;
  value: number;
}

type WorldBankApiResponse = [
  {
    page: number;
    pages: number;
    per_page: string;
    total: number;
  },
  Array<{
    indicator: { id: string; value: string };
    country: { id: string; value: string };
    countryiso3code: string;
    date: string;
    value: number | null;
    unit: string;
    obs_status: string;
    decimal: number;
  }>
];

@Injectable({
  providedIn: 'root',
})
export class InflationService {
  private http = inject(HttpClient);

  private readonly url =
    'https://api.worldbank.org/v2/country/COL/indicator/FP.CPI.TOTL.ZG?format=json';

  getInflationData(): Observable<InflationRecord[]> {
    return this.http.get<WorldBankApiResponse>(this.url).pipe(
      map((response) => {
        const records = response[1] ?? [];

        return records
          .filter((item) => item.value !== null)
          .map((item) => ({
            year: item.date,
            value: Number(item.value),
          }))
          .sort((a, b) => Number(a.year) - Number(b.year));
      }),
    );
  }

  getLatestInflation(): Observable<InflationRecord | null> {
    return this.getInflationData().pipe(
      map((records) => {
        if (records.length === 0) {
          return null;
        }

        return records[records.length - 1];
      }),
    );
  }
}