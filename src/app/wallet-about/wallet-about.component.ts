import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-wallet-about',
  standalone: true,
  imports: [AppHeaderComponent, RouterLink],
  templateUrl: './wallet-about.component.html',
  styleUrl: './wallet-about.component.css'
})
export class WalletAboutComponent {}
