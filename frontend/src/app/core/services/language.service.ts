import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'uk' | 'en' | 'ru';

/**
 * Сервіс для управління мовою інтерфейсу
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'app-language';
  private readonly SUPPORTED_LANGUAGES: Language[] = ['uk', 'en', 'ru'];
  private readonly DEFAULT_LANGUAGE: Language = 'uk';
  
  private languageSubject: BehaviorSubject<Language>;
  public language$: Observable<Language>;

  constructor(private translateService: TranslateService) {
    // Отримуємо збережену мову або визначаємо за замовчуванням
    const initialLanguage = this.getInitialLanguage();
    this.languageSubject = new BehaviorSubject<Language>(initialLanguage);
    this.language$ = this.languageSubject.asObservable();
    
    // Налаштовуємо TranslateService
    this.translateService.setDefaultLang(this.DEFAULT_LANGUAGE);
    this.setLanguage(initialLanguage);
  }

  /**
   * Отримує поточну мову
   */
  get currentLanguage(): Language {
    return this.languageSubject.value;
  }

  /**
   * Встановлює мову інтерфейсу
   */
  setLanguage(language: Language): void {
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      language = this.DEFAULT_LANGUAGE;
    }
    
    this.languageSubject.next(language);
    this.translateService.use(language);
    this.updateHtmlLang(language);
    this.saveLanguage(language);
  }

  /**
   * Отримує початкову мову (з localStorage або за замовчуванням)
   */
  private getInitialLanguage(): Language {
    // Перевіряємо localStorage
    const saved = localStorage.getItem(this.LANGUAGE_KEY);
    if (saved && this.SUPPORTED_LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }

    // Завжди повертаємо мову за замовчуванням (українську)
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Оновлює атрибут lang в <html>
   */
  private updateHtmlLang(language: Language): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
    }
  }

  /**
   * Зберігає мову в localStorage
   */
  private saveLanguage(language: Language): void {
    localStorage.setItem(this.LANGUAGE_KEY, language);
  }
}

