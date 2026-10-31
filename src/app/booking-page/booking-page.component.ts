import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TicketBookingModule } from '../ticket-booking/ticket-booking.module';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [CommonModule, TicketBookingModule, AppHeaderComponent],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.css',
  encapsulation: ViewEncapsulation.None
})
export class BookingPageComponent implements OnInit {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.isAdmin()) {
      this.router.navigate(['/user-login']);
    }
  }
}
