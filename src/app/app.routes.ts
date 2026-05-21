import { Routes } from '@angular/router';
import { AhorroPageComponent } from './features/ahorro/pages/ahorro-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'ahorros',
    pathMatch: 'full'
  },
  {
    path: 'ahorros',
    component: AhorroPageComponent
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent
  },
  {
    path: '**',
    redirectTo: 'ahorros'
  }
];