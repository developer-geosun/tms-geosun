import { Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { StopServiceComponent } from './pages/stop-service/stop-service.component';
import { ServiceStopGuard } from './core/guards/service-stop.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'main', component: MainComponent, canActivate: [ServiceStopGuard] },
  { path: 'stop-service', component: StopServiceComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' }
];
