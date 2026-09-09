import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketService } from '../ticket.service';

export interface PassengerForm {
  name: string;
  dob: string;
  gender: string;
  doj: string;
  source: string;
  dest: string;
  trainNo: string;
}

@Component({
  selector: 'app-ticket-booking',
  standalone: false,
  templateUrl: './ticket-booking.component.html',
  styleUrl: './ticket-booking.component.css'
})
export class TicketBookingComponent {
  @Output() readonly ticketBooked = new EventEmitter<Ticket>();

  passenger: PassengerForm = this.createEmptyPassenger();
  selectedClass = 'All Classes';
  quota = 'GENERAL';
  flexibleDate = false;
  availableBerth = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly ticketService: TicketService) {}

  submitBooking(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isValid()) {
      this.errorMessage = 'Please complete all passenger and journey details.';
      return;
    }

    this.isSubmitting = true;
    this.ticketService.bookTicket(this.passenger).subscribe({
      next: (ticket) => {
        this.isSubmitting = false;
        this.successMessage = `Ticket booked successfully. PNR ${ticket.ticketId}.`;
        this.ticketBooked.emit(ticket);
        this.passenger = this.createEmptyPassenger();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Booking failed. Please confirm that Spring Boot is running on port 8080.';
      }
    });
  }

  private isValid(): boolean {
    return Object.values(this.passenger).every((value) => value.trim().length > 0);
  }

  private createEmptyPassenger(): PassengerForm {
    return {
      name: '',
      dob: '',
      gender: '',
      doj: '',
      source: '',
      dest: '',
      trainNo: ''
    };
  }
}
