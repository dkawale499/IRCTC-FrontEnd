import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export type TicketStatus = 'Confirmed' | 'RAC' | 'Waitlisted';

export interface Ticket {
  ticketId: number;
  name: string;
  dob: string;
  gender: string;
  doj: string;
  source: string;
  dest: string;
  trainNo: string;
  ticketStatus: TicketStatus;
  coach?: string;
  berth?: string;
}

interface BackendTicket extends Omit<Ticket, 'ticketStatus'> {
  ticketStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly ticketsUrl = '/tickets';

  constructor(private readonly http: HttpClient) {}

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<BackendTicket[]>(this.ticketsUrl).pipe(
      map((tickets) => tickets.map((ticket) => this.normalizeTicket(ticket)))
    );
  }

  getTicket(ticketId: number): Observable<Ticket> {
    return this.http.get<BackendTicket>(`/ticket/${ticketId}`).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  bookTicket(passenger: Omit<Ticket, 'ticketId' | 'ticketStatus' | 'coach' | 'berth'>): Observable<Ticket> {
    return this.http.post<BackendTicket>('/ticket', passenger).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  deleteTicket(ticketId: number): Observable<Ticket> {
    return this.http.delete<BackendTicket>(`/tdelete/${ticketId}`).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  updateTicket(ticketId: number): Observable<Ticket> {
    return this.http.patch<BackendTicket>(`/tup/${ticketId}`, {}).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  private normalizeTicket(ticket: BackendTicket): Ticket {
    const status = (ticket.ticketStatus ?? '').toLowerCase();
    let ticketStatus: TicketStatus = 'Confirmed';

    if (status.includes('wait')) {
      ticketStatus = 'Waitlisted';
    } else if (status.includes('rac')) {
      ticketStatus = 'RAC';
    }

    return {
      ...ticket,
      ticketStatus,
      coach: ticket.coach ?? '—',
      berth: ticket.berth ?? 'Not assigned'
    };
  }
}
