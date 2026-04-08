import { Routes } from '@angular/router';
import { serviceStopGuard } from './core/guards/service-stop.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  {
    path: 'main',
    canActivate: [serviceStopGuard],
    loadComponent: () => import('./pages/main/main.component').then((m) => m.MainComponent)
  },
  {
    path: 'stop-service',
    loadComponent: () => import('./pages/stop-service/stop-service.component').then((m) => m.StopServiceComponent)
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent)
  },
  { path: '**', redirectTo: '/404' }
];
