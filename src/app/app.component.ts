import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { Ticket, TicketService, TicketStatus, TrainSchedule } from './ticket.service';
import { TicketBookingModule } from './ticket-booking/ticket-booking.module';

type ViewMode = 'All tickets' | TicketStatus;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketBookingModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  searchTerm = '';
  activeView: ViewMode = 'All tickets';
  selectedTicket: Ticket | null = null;
  isLoading = true;
  apiMessage = 'Connecting to Spring Boot';
  showAvailableTickets = false;
  showBookingPage = false;
  showAdminPanel = false;
  searchFrom = '';
  searchTo = '';
  searchDate = '';
  searchClass = 'All Class';
  searchQuota = 'General';
  trainSearchMessage = '';
  trainResults: TrainSchedule[] = [];
  authEmail = '';
  authPassword = '';
  authFullName = '';
  authPhone = '';
  authMessage = '';
  showAuthForm = false;
  authMode: 'login' | 'register' | 'forgot' | 'reset' = 'login';
  isAuthenticated = false;
  userRole = 'USER';
  adminTrains: TrainSchedule[] = [];
  adminTrain: Omit<TrainSchedule, 'id'> = this.createEmptyTrain();
  adminMessage = '';
  resetToken = '';
  resetPassword = '';

  tickets: Ticket[] = [
    { ticketId: 847291, name: 'Ananya Sharma', dob: '14 Aug 1996', gender: 'Female', doj: '18 Sep 2024', source: 'New Delhi', dest: 'Jaipur', trainNo: '12915', ticketStatus: 'Confirmed', coach: 'A2', berth: '32 · Lower' },
    { ticketId: 847288, name: 'Rohan Mehta', dob: '02 Feb 1989', gender: 'Male', doj: '18 Sep 2024', source: 'Mumbai Central', dest: 'Ahmedabad', trainNo: '12931', ticketStatus: 'Confirmed', coach: 'B4', berth: '18 · Side lower' },
    { ticketId: 847276, name: 'Meera Iyer', dob: '27 Nov 2001', gender: 'Female', doj: '19 Sep 2024', source: 'Chennai Central', dest: 'Bengaluru', trainNo: '12639', ticketStatus: 'RAC', coach: 'C1', berth: '09 · Side lower' },
    { ticketId: 847259, name: 'Kabir Singh', dob: '10 Jun 1978', gender: 'Male', doj: '20 Sep 2024', source: 'Kolkata', dest: 'Bhubaneswar', trainNo: '12801', ticketStatus: 'Waitlisted', coach: '—', berth: 'WL 04' },
    { ticketId: 847241, name: 'Nisha Verma', dob: '22 Mar 1993', gender: 'Female', doj: '21 Sep 2024', source: 'Lucknow', dest: 'Varanasi', trainNo: '12559', ticketStatus: 'Confirmed', coach: 'D3', berth: '41 · Upper' }
  ];

  constructor(private readonly ticketService: TicketService, private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.userRole = this.authService.getRole();
    this.loadTickets();
  }

  get isAdmin(): boolean {
    return this.userRole.toUpperCase() === 'ADMIN';
  }

  private loadTickets(): void {
    this.isLoading = true;
    const ticketsRequest = this.isAdmin
      ? this.ticketService.getAdminTickets()
      : this.ticketService.getPassengerTickets();
    ticketsRequest.subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
        this.apiMessage = 'Live data from Spring Boot';
      },
      error: (error) => {
        this.isLoading = false;
        this.apiMessage = this.errorMessage(error, 'Spring Boot is unavailable · showing sample data');
        this.handleUnauthorized(error);
      }
    });
  }

  get filteredTickets(): Ticket[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();
    return this.tickets.filter((ticket) => {
      const matchesView = this.activeView === 'All tickets' || ticket.ticketStatus === this.activeView;
      const matchesSearch = !normalizedSearch || [ticket.name, ticket.ticketId, ticket.trainNo, ticket.source, ticket.dest]
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      return matchesView && matchesSearch;
    });
  }

  countFor(status: TicketStatus): number {
    return this.tickets.filter((ticket) => ticket.ticketStatus === status).length;
  }

  selectTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
  }

  closeDetails(): void {
    this.selectedTicket = null;
  }

  setView(view: ViewMode): void {
    this.activeView = view;
  }

  addBookedTicket(ticket: Ticket): void {
    this.tickets = [ticket, ...this.tickets];
  }

  openBooking(): void {
    this.showAvailableTickets = false;
    this.showBookingPage = true;
    setTimeout(() => document.querySelector('#booking-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  openHome(): void {
    this.showAvailableTickets = false;
    this.showBookingPage = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAvailableTickets(): void {
    this.showAdminPanel = false;
    this.showBookingPage = false;
    this.showAvailableTickets = true;
    setTimeout(() => document.querySelector('#available-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  openAdminPanel(): void {
    if (!this.isAdmin) {
      this.authMessage = 'Administrator access is required.';
      this.showAuthForm = true;
      this.authMode = 'login';
      return;
    }
    this.showBookingPage = false;
    this.showAvailableTickets = false;
    this.showAdminPanel = true;
    this.loadAdminTrains();
  }

  createTrain(): void {
    this.adminMessage = '';
    this.ticketService.createTrain(this.adminTrain).subscribe({
      next: (train) => {
        this.adminTrains = [train, ...this.adminTrains];
        this.adminTrain = this.createEmptyTrain();
        this.adminMessage = 'Train schedule created successfully.';
      },
      error: (error) => {
        this.adminMessage = this.errorMessage(error, 'Could not create train schedule.');
        this.handleUnauthorized(error);
      }
    });
  }

  cancelSelectedTicket(): void {
    if (!this.selectedTicket || this.selectedTicket.ticketStatus === 'Cancelled') {
      return;
    }
    this.ticketService.cancelTicket(this.selectedTicket.ticketId).subscribe({
      next: (ticket) => {
        this.tickets = this.tickets.map((item) => item.ticketId === ticket.ticketId ? ticket : item);
        this.selectedTicket = ticket;
      },
      error: (error) => {
        this.apiMessage = this.errorMessage(error, 'Could not cancel this ticket.');
        this.handleUnauthorized(error);
      }
    });
  }

  requestPasswordReset(): void {
    this.authService.forgotPassword(this.authEmail.trim()).subscribe({
      next: (response) => {
        this.resetToken = response.resetToken ?? '';
        this.authMessage = response.resetToken
          ? 'Reset token created. Enter it below with your new password.'
          : 'No account was found for that email.';
        if (response.resetToken) {
          this.authMode = 'reset';
        }
      },
      error: (error) => this.authMessage = this.errorMessage(error, 'Could not request a password reset.')
    });
  }

  resetAccountPassword(): void {
    this.authService.resetPassword(this.resetToken.trim(), this.resetPassword).subscribe({
      next: () => {
        this.authMode = 'login';
        this.resetPassword = '';
        this.authMessage = 'Password reset successful. You can now log in.';
      },
      error: (error) => this.authMessage = this.errorMessage(error, 'Could not reset password.')
    });
  }

  private loadAdminTrains(): void {
    this.ticketService.getAdminTrains().subscribe({
      next: (trains) => this.adminTrains = trains,
      error: (error) => {
        this.adminMessage = this.errorMessage(error, 'Could not load train schedules.');
        this.handleUnauthorized(error);
      }
    });
  }

  private createEmptyTrain(): Omit<TrainSchedule, 'id'> {
    return { trainNo: '', source: '', destination: '', availableSeats: 0, journeyDate: '' };
  }

  searchTrains(): void {
    if (!this.searchFrom || !this.searchTo || !this.searchDate) {
      this.trainSearchMessage = 'Enter source, destination, and journey date.';
      return;
    }

    this.trainSearchMessage = 'Searching trains...';
    this.ticketService.searchTrains(this.searchFrom.trim(), this.searchTo.trim(), this.searchDate).subscribe({
      next: (trains) => {
        this.trainResults = trains;
        this.trainSearchMessage = trains.length
          ? `${trains.length} train${trains.length === 1 ? '' : 's'} found.`
          : 'No trains found for this route and date.';
      },
      error: (error) => {
        this.trainResults = [];
        this.trainSearchMessage = this.errorMessage(error, 'Train search failed.');
        this.handleUnauthorized(error);
      }
    });
  }

  login(): void {
    this.authMessage = '';
    this.authService.login(this.authEmail.trim(), this.authPassword).subscribe({
      next: () => {
        this.isAuthenticated = true;
        this.userRole = this.authService.getRole();
        this.showAuthForm = false;
        this.authPassword = '';
        this.showAdminPanel = false;
        this.authMessage = 'Logged in successfully.';
        this.loadTickets();
      },
      error: (error) => this.authMessage = this.errorMessage(error, 'Login failed.')
    });
  }

  register(): void {
    this.authMessage = '';
    this.authService.register({
      fullName: this.authFullName.trim(),
      email: this.authEmail.trim(),
      phone: this.authPhone.trim(),
      password: this.authPassword
    }).subscribe({
      next: () => {
        this.authMode = 'login';
        this.authMessage = 'Registration successful. You can now log in.';
        this.authPassword = '';
      },
      error: (error) => this.authMessage = this.errorMessage(error, 'Registration failed.')
    });
  }

  logout(): void {
    this.authService.logout();
    this.isAuthenticated = false;
    this.userRole = 'USER';
    this.showAdminPanel = false;
    this.apiMessage = 'Logged out';
  }

  private handleUnauthorized(error: { status?: number }): void {
    if (error.status === 401) {
      this.authService.logout();
      this.isAuthenticated = false;
      this.showAuthForm = true;
    }
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }
    if (error.error && typeof error.error === 'object') {
      return error.error.message ?? fallback;
    }
    return fallback;
  }

  swapStations(): void {
    [this.searchFrom, this.searchTo] = [this.searchTo, this.searchFrom];
  }
}
