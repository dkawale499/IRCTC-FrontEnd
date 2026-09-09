import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketBookingComponent } from './ticket-booking.component';

@NgModule({
  declarations: [TicketBookingComponent],
  imports: [CommonModule, FormsModule],
  exports: [TicketBookingComponent]
})
export class TicketBookingModule {}
