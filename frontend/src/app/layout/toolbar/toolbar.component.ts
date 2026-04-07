import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { ConfigService } from '../../core/services/config.service';
import { LanguageService, Language } from '../../core/services/language.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { SocialIconComponent } from '../../shared/components/social-icon/social-icon.component';

/**
 * Компонент панелі інструментів (toolbar)
 */
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatButtonToggleModule,
    TranslateModule,
    LogoComponent,
    SocialIconComponent
  ]
})
export class ToolbarComponent {
  // Використовуємо async pipe для автоматичної відписки
  theme$ = this.themeService.theme$;
  language$ = this.languageService.language$;
  currentLanguage: Language = 'uk';
  currentTheme: Theme = 'azure-blue';
  isLogoIconsOpen = false;
  
  // Доступні мови
  languages: { code: Language; label: string }[] = [
    { code: 'uk', label: 'UA' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' }
  ];

  themes: { code: Theme; label: string }[] = [
    { code: 'azure-blue', label: 'Azure & Blue' },
    { code: 'rose-red', label: 'Rose & Red' },
    { code: 'magenta-violet', label: 'Magenta & Violet' },
    { code: 'cyan-orange', label: 'Cyan & Orange' }
  ];

  constructor(
    private themeService: ThemeService,
    public configService: ConfigService,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private elementRef: ElementRef<HTMLElement>
  ) {
    // Підписуємося на зміни мови
    this.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });

    this.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  /**
   * Змінює тему інтерфейсу
   */
  changeTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  /**
   * Змінює мову інтерфейсу
   */
  changeLanguage(language: Language): void {
    this.languageService.setLanguage(language);
  }

  toggleLogoIcons(event: Event): void {
    event.stopPropagation();
    this.isLogoIconsOpen = !this.isLogoIconsOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isLogoIconsOpen) {
      return;
    }

    const clickedElement = event.target as Node | null;
    if (!clickedElement) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(clickedElement)) {
      this.isLogoIconsOpen = false;
    }
  }

  /**
   * Отримує локалізовану назву секції мови у меню налаштувань
   */
  getLanguageSectionTitle(): string {
    return this.getSettingsSectionTitle('settings.languageSection');
  }

  /**
   * Отримує локалізовану назву секції теми у меню налаштувань
   */
  getThemeSectionTitle(): string {
    return this.getSettingsSectionTitle('settings.themeSection');
  }

  private getSettingsSectionTitle(key: 'settings.languageSection' | 'settings.themeSection'): string {
    const translated = this.translateService.instant(key);
    if (translated !== key) {
      return translated;
    }

    const fallbackByLanguage: Record<Language, Record<'settings.languageSection' | 'settings.themeSection', string>> = {
      uk: {
        'settings.languageSection': 'Мова',
        'settings.themeSection': 'Тема'
      },
      en: {
        'settings.languageSection': 'Language',
        'settings.themeSection': 'Theme'
      },
      ru: {
        'settings.languageSection': 'Язык',
        'settings.themeSection': 'Тема'
      }
    };

    return fallbackByLanguage[this.currentLanguage][key];
  }
}

