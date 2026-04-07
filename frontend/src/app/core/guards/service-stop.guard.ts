import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ConfigService } from '../services/config.service';

/**
 * Guard для редиректа на страницу stop-service при активации настройки isServiceStopped
 * Исключает из редиректа саму страницу stop-service и страницу 404
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceStopGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Если сервис не остановлен, разрешаем доступ
    if (!this.configService.isServiceStopped) {
      return true;
    }

    // Получаем текущий путь
    const currentPath = route.routeConfig?.path || '';

    // Исключаем страницы stop-service и 404 из редиректа
    if (currentPath === 'stop-service' || currentPath === '404') {
      return true;
    }

    // Выполняем редирект на stop-service
    this.router.navigate(['/stop-service']);
    return false;
  }
}

