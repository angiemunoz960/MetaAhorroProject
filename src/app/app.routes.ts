import { Routes } from '@angular/router';
import { AhorroPageComponent } from './features/ahorro/pages/ahorro-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';

export const routes: Routes = [
  {
    path: 'ahorro',
    component: AhorroPageComponent,
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
