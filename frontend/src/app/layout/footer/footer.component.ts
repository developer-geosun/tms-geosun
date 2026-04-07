import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigService } from '../../core/services/config.service';
import { SocialIconComponent } from '../../shared/components/social-icon/social-icon.component';

/**
 * Компонент футера
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [TranslateModule, SocialIconComponent]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(public configService: ConfigService) {}
}

