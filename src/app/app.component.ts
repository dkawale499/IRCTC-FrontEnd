import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OnInit } from '@angular/core';
import { Ticket, TicketService, TicketStatus } from './ticket.service';
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
  searchFrom = '';
  searchTo = '';
  searchDate = '';
  searchClass = 'All Class';
  searchQuota = 'General';
  trainSearchMessage = '';

  tickets: Ticket[] = [
    { ticketId: 847291, name: 'Ananya Sharma', dob: '14 Aug 1996', gender: 'Female', doj: '18 Sep 2024', source: 'New Delhi', dest: 'Jaipur', trainNo: '12915', ticketStatus: 'Confirmed', coach: 'A2', berth: '32 · Lower' },
    { ticketId: 847288, name: 'Rohan Mehta', dob: '02 Feb 1989', gender: 'Male', doj: '18 Sep 2024', source: 'Mumbai Central', dest: 'Ahmedabad', trainNo: '12931', ticketStatus: 'Confirmed', coach: 'B4', berth: '18 · Side lower' },
    { ticketId: 847276, name: 'Meera Iyer', dob: '27 Nov 2001', gender: 'Female', doj: '19 Sep 2024', source: 'Chennai Central', dest: 'Bengaluru', trainNo: '12639', ticketStatus: 'RAC', coach: 'C1', berth: '09 · Side lower' },
    { ticketId: 847259, name: 'Kabir Singh', dob: '10 Jun 1978', gender: 'Male', doj: '20 Sep 2024', source: 'Kolkata', dest: 'Bhubaneswar', trainNo: '12801', ticketStatus: 'Waitlisted', coach: '—', berth: 'WL 04' },
    { ticketId: 847241, name: 'Nisha Verma', dob: '22 Mar 1993', gender: 'Female', doj: '21 Sep 2024', source: 'Lucknow', dest: 'Varanasi', trainNo: '12559', ticketStatus: 'Confirmed', coach: 'D3', berth: '41 · Upper' }
  ];

  constructor(private readonly ticketService: TicketService) {}

  ngOnInit(): void {
    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
        this.apiMessage = 'Live data from Spring Boot';
      },
      error: () => {
        this.isLoading = false;
        this.apiMessage = 'Spring Boot is unavailable · showing sample data';
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
    this.showBookingPage = false;
    this.showAvailableTickets = true;
    setTimeout(() => document.querySelector('#available-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  searchTrains(): void {
    if (!this.searchFrom || !this.searchTo || !this.searchDate) {
      this.trainSearchMessage = 'Enter source, destination, and journey date.';
      return;
    }

    this.trainSearchMessage = `Searching trains from ${this.searchFrom} to ${this.searchTo}.`;
  }

  swapStations(): void {
    [this.searchFrom, this.searchTo] = [this.searchTo, this.searchFrom];
  }
}
