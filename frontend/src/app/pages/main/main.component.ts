import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Компонент головної сторінки
 */
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [TranslateModule]
})
export class MainComponent {

}

