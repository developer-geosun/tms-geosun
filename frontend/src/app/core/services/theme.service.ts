import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'rose-red' | 'azure-blue' | 'magenta-violet' | 'cyan-orange';

/**
 * Сервіс для управління кольоровою темою додатку
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly THEME_CLASSES = [
    'theme-rose-red',
    'theme-azure-blue',
    'theme-magenta-violet',
    'theme-cyan-orange'
  ];
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;

  constructor() {
    // Отримуємо збережену тему або використовуємо базову за замовчуванням
    const savedTheme = this.getSavedTheme();
    this.themeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();
    this.applyTheme(savedTheme);
  }

  /**
   * Отримує поточну тему
   */
  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Встановлює конкретну тему
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Застосовує тему до body елемента
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    body.classList.remove(...this.THEME_CLASSES, 'light-theme', 'dark-theme');
    body.classList.add(`theme-${theme}`);
  }

  /**
   * Отримує збережену тему з localStorage
   */
  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'rose-red' || saved === 'azure-blue' || saved === 'magenta-violet' || saved === 'cyan-orange') {
      return saved;
    }

    // Зворотна сумісність зі старими значеннями світлої/темної теми
    if (saved === 'light' || saved === 'dark') {
      return 'azure-blue';
    }

    return 'azure-blue';
  }

  /**
   * Зберігає тему в localStorage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}

