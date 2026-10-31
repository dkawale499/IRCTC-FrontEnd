import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

export type TicketStatus = 'Confirmed' | 'RAC' | 'Waitlisted' | 'Cancelled';
export type CoachType = 'SL' | '3AC' | '2AC' | '1AC';

export interface CoachConfiguration {
  coachType: CoachType;
  coachCount: number;
  seatsPerCoach: number;
  availableSeats?: number;
  totalSeats?: number;
}

export interface TrainSchedule {
  id: number;
  trainNo: string;
  source: string;
  destination: string;
  availableSeats: number;
  journeyDate: string;
  ticketFare: number;
  coaches?: CoachConfiguration[];
}

export type TrainScheduleRequest = Omit<TrainSchedule, 'id' | 'availableSeats' | 'coaches'> & {
  coaches: CoachConfiguration[];
};

export interface Ticket {
  ticketId: number;
  name: string;
  dob: string;
  gender: string;
  doj: string;
  source: string;
  dest: string;
  trainNo: string;
  ticketFare?: number;
  ticketStatus: TicketStatus;
  coach?: string;
  berth?: string;
}

interface BackendTicket extends Omit<Ticket, 'ticketStatus'> {
  ticketStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<BackendTicket[]>(`${this.apiUrl}/tickets`).pipe(
      map((tickets) => tickets.map((ticket) => this.normalizeTicket(ticket)))
    );
  }

  getPassengerTickets(): Observable<Ticket[]> {
    return this.http.get<BackendTicket[]>(`${this.apiUrl}/tickets/mine`).pipe(
      map((tickets) => tickets.map((ticket) => this.normalizeTicket(ticket)))
    );
  }

  getAdminTickets(): Observable<Ticket[]> {
    return this.http.get<BackendTicket[]>(`${this.apiUrl}/admin/tickets`).pipe(
      map((tickets) => tickets.map((ticket) => this.normalizeTicket(ticket)))
    );
  }

  getTicket(ticketId: number): Observable<Ticket> {
    return this.http.get<BackendTicket>(`${this.apiUrl}/ticket/${ticketId}`).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  bookTicket(passenger: Omit<Ticket, 'ticketId' | 'ticketStatus' | 'coach' | 'berth'>): Observable<Ticket> {
    return this.http.post<BackendTicket>(`${this.apiUrl}/ticket`, passenger).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  cancelTicket(ticketId: number): Observable<Ticket> {
    return this.http.post<BackendTicket>(`${this.apiUrl}/ticket/${ticketId}/cancel`, {}).pipe(
      map((ticket) => this.normalizeTicket(ticket))
    );
  }

  searchTrains(source: string, destination: string, journeyDate: string): Observable<TrainSchedule[]> {
    return this.http.get<TrainSchedule[]>(`${this.apiUrl}/trains/search`, {
      params: { source, destination, journeyDate }
    });
  }

  getTicketFare(trainNo: string, journeyDate: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/trains/fare`, {
      params: { trainNo, journeyDate }
    });
  }

  createTrain(train: TrainScheduleRequest): Observable<TrainSchedule> {
    return this.http.post<TrainSchedule>(`${this.apiUrl}/admin/trains`, train);
  }

  getAdminTrains(): Observable<TrainSchedule[]> {
    return this.http.get<TrainSchedule[]>(`${this.apiUrl}/admin/trains`);
  }

  updateTrainCoaches(scheduleId: number, coaches: CoachConfiguration[]): Observable<TrainSchedule> {
    return this.http.put<TrainSchedule>(`${this.apiUrl}/admin/trains/${scheduleId}/coaches`, coaches);
  }

  updateTrainFare(scheduleId: number, ticketFare: number): Observable<TrainSchedule> {
    return this.http.put<TrainSchedule>(`${this.apiUrl}/admin/trains/${scheduleId}/fare`, { ticketFare });
  }

  private normalizeTicket(ticket: BackendTicket): Ticket {
    const status = (ticket.ticketStatus ?? '').toLowerCase();
    let ticketStatus: TicketStatus = 'Confirmed';

    if (status.includes('cancel')) {
      ticketStatus = 'Cancelled';
    } else if (status.includes('wait')) {
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
