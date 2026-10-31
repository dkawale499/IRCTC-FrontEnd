import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketService } from '../ticket.service';
import { WalletService } from '../wallet.service';

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
export class TicketBookingComponent implements OnInit {
  @Output() readonly ticketBooked = new EventEmitter<Ticket>();

  readonly steps = [
    { number: 1, title: 'Passenger details' },
    { number: 2, title: 'Review journey' },
    { number: 3, title: 'Payment' }
  ];
  passenger: PassengerForm = this.createEmptyPassenger();
  step = 1;
  hasTrainSelection = false;
  isSubmitting = false;
  isWalletLoading = true;
  walletBalance = 0;
  passengerEmail = '';
  passengerPhone = '';
  ticketFare: number | null = null;
  isFareLoading = false;
  fareError = '';
  walletError = '';
  errorMessage = '';
  booking: Ticket | null = null;
  private fareLookupId = 0;

  constructor(
    private readonly ticketService: TicketService,
    private readonly walletService: WalletService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const trainNo = params.get('trainNo')?.trim() ?? '';
      const source = params.get('source')?.trim() ?? '';
      const destination = params.get('destination')?.trim() ?? '';
      const journeyDate = params.get('journeyDate') ?? '';
      this.hasTrainSelection = Boolean(trainNo && source && destination && journeyDate);
      this.passenger = {
        ...this.createEmptyPassenger(),
        trainNo,
        source,
        dest: destination,
        doj: journeyDate
      };
      this.ticketFare = null;
      this.fareError = '';
      if (this.hasTrainSelection) {
        this.loadTicketFare(trainNo, journeyDate);
      }
    });
    this.loadWallet();
  }

  continueToReview(): void {
    this.errorMessage = '';
    if (!this.hasTrainSelection) {
      this.errorMessage = 'Search for a train and select it before continuing.';
      return;
    }
    if (!this.passenger.name.trim() || !this.passenger.dob || !this.passenger.gender) {
      this.errorMessage = 'Enter the passenger name, date of birth, and gender to continue.';
      return;
    }
    if (this.ticketFare === null || this.isFareLoading || this.fareError) {
      this.errorMessage = this.fareError || 'Wait for the scheduled ticket fare to load.';
      return;
    }
    this.step = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  continueToPayment(): void {
    this.errorMessage = '';
    this.step = 3;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    this.errorMessage = '';
    if (this.step > 1 && this.step < 4) {
      this.step--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  payAndBook(): void {
    this.errorMessage = '';
    if (this.step !== 3 || this.ticketFare === null) {
      this.errorMessage = 'The ticket fare is not available. Return to train search and try again.';
      return;
    }
    if (this.isWalletLoading || this.walletError) {
      this.errorMessage = this.walletError || 'Wait for your wallet balance to load.';
      return;
    }
    if (this.walletBalance < this.ticketFare) {
      this.errorMessage = 'Your e-wallet balance is not enough for this ticket.';
      return;
    }

    this.isSubmitting = true;
    this.ticketService.bookTicket(this.passenger).subscribe({
      next: (ticket) => {
        this.booking = ticket;
        this.step = 4;
        this.isSubmitting = false;
        this.ticketBooked.emit(ticket);
        this.loadWallet();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = this.readError(error, 'Payment could not be completed. Please try again.');
        this.loadWallet();
      }
    });
  }

  finishBooking(): void {
    this.router.navigate(['/available-tickets']);
  }

  private loadTicketFare(trainNo: string, journeyDate: string): void {
    const lookupId = ++this.fareLookupId;
    this.isFareLoading = true;
    this.ticketService.getTicketFare(trainNo, journeyDate).subscribe({
      next: (ticketFare) => {
        if (lookupId !== this.fareLookupId) return;
        this.ticketFare = ticketFare;
        this.isFareLoading = false;
      },
      error: (error) => {
        if (lookupId !== this.fareLookupId) return;
        this.fareError = this.readError(error, 'Could not load a fare for the selected train.');
        this.isFareLoading = false;
      }
    });
  }

  private loadWallet(): void {
    this.isWalletLoading = true;
    this.walletError = '';
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.walletBalance = wallet.balance;
        this.passengerEmail = wallet.email;
        this.passengerPhone = wallet.phone;
        this.isWalletLoading = false;
      },
      error: (error) => {
        this.isWalletLoading = false;
        this.walletError = this.readError(error, 'Could not load your e-wallet.');
      }
    });
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

  private readError(error: { error?: { message?: string; detail?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') {
      return error.error.message ?? error.error.detail ?? fallback;
    }
    return fallback;
  }
}
