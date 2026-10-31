import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { TicketService, TrainSchedule } from '../ticket.service';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  source = '';
  destination = '';
  journeyDate = '';
  results: TrainSchedule[] = [];
  message = '';

  constructor(
    private readonly ticketService: TicketService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get isPassengerDashboard(): boolean {
    return this.authService.isAuthenticated() && !this.authService.isAdmin();
  }

  get displayName(): string {
    return this.authService.getDisplayName();
  }

  ngOnInit(): void {
    this.journeyDate = this.toLocalDateValue(new Date());
  }

  swapStations(): void {
    [this.source, this.destination] = [this.destination, this.source];
  }

  search(): void {
    if (!this.source || !this.destination || !this.journeyDate) {
      this.message = 'Enter source, destination, and journey date.';
      return;
    }
    this.message = 'Searching trains...';
    this.ticketService.searchTrains(this.source.trim(), this.destination.trim(), this.journeyDate).subscribe({
      next: (results) => {
        this.results = results;
        this.message = results.length ? `${results.length} train(s) found.` : 'No trains found for this route and date.';
      },
      error: (error) => this.message = error.error?.message ?? 'Train search failed.'
    });
  }

  bookTrain(train: TrainSchedule): void {
    if (!this.authService.isAuthenticated() || this.authService.isAdmin()) {
      this.router.navigate(['/user-login']);
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        trainNo: train.trainNo,
        source: train.source,
        destination: train.destination,
        journeyDate: train.journeyDate,
        ticketFare: train.ticketFare ?? 100
      }
    });
  }

  private toLocalDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
