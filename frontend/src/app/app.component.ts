import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent, FooterComponent]
})
export class AppComponent implements OnInit {
  title = 'tms-geosun-base';

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    // Ініціалізація мови при старті додатку
    // LanguageService автоматично визначить та встановить мову
  }
}
