import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { Ticket, TicketService, TicketStatus } from '../ticket.service';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-available-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './available-tickets.component.html',
  styleUrl: './available-tickets.component.css'
})
export class AvailableTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  selectedStatus: 'All' | TicketStatus = 'All';
  searchTerm = '';
  message = '';
  isLoading = true;
  isAdmin = false;

  constructor(private readonly ticketService: TicketService, private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    const request = this.isAdmin ? this.ticketService.getAdminTickets() : this.ticketService.getPassengerTickets();
    request.subscribe({
      next: (tickets) => { this.tickets = tickets; this.isLoading = false; },
      error: (error) => { this.isLoading = false; this.message = this.errorMessage(error, 'Unable to load tickets. Please sign in.'); }
    });
  }

  get filteredTickets(): Ticket[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.tickets.filter((ticket) => {
      const matchesStatus = this.selectedStatus === 'All' || ticket.ticketStatus === this.selectedStatus;
      const matchesSearch = !search || [ticket.name, ticket.ticketId, ticket.trainNo, ticket.source, ticket.dest].some((value) => String(value).toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }

  countFor(status: TicketStatus): number {
    return this.tickets.filter((ticket) => ticket.ticketStatus === status).length;
  }

  cancel(ticket: Ticket): void {
    this.ticketService.cancelTicket(ticket.ticketId).subscribe({
      next: (updated) => this.tickets = this.tickets.map((item) => item.ticketId === updated.ticketId ? updated : item),
      error: (error) => this.message = this.errorMessage(error, 'Could not cancel this ticket.')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
