import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AdminUser, AuthService, RegisterRequest } from '../auth.service';
import { CoachConfiguration, CoachType, Ticket, TicketService, TrainSchedule, TrainScheduleRequest } from '../ticket.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  readonly coachTypes: CoachType[] = ['SL', '3AC', '2AC', '1AC'];
  readonly defaultSeatsPerCoach: Record<CoachType, number> = { SL: 72, '3AC': 64, '2AC': 54, '1AC': 24 };
  tickets: Ticket[] = [];
  trains: TrainSchedule[] = [];
  fareUpdates: Record<number, number> = {};
  users: AdminUser[] = [];
  newUser: RegisterRequest = this.createEmptyUser();
  message = '';
  userMessage = '';
  isUserMessageError = false;
  isLoadingUsers = true;
  isSavingUser = false;
  deletingUserId: number | null = null;
  isSavingSchedule = false;
  savingFareScheduleId: number | null = null;
  editingScheduleId: number | null = null;
  train: Omit<TrainScheduleRequest, 'coaches'> = this.createEmptyTrain();
  coachCounts: Record<CoachType, number> = this.createCoachCounts();
  seatsPerCoach: Record<CoachType, number> = { ...this.defaultSeatsPerCoach };

  get calculatedSeats(): number {
    return this.coachTypes.reduce(
      (total, type) => total + (this.coachCounts[type] ?? 0) * (this.seatsPerCoach[type] ?? 0),
      0
    );
  }

  get cancelledTickets(): number {
    return this.tickets.filter((ticket) => ticket.ticketStatus === 'Cancelled').length;
  }

  get schedulesToday(): number {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    return this.trains.filter((train) => train.journeyDate.slice(0, 10) === today).length;
  }

  constructor(
    readonly authService: AuthService,
    private readonly ticketService: TicketService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  get activeOperation(): 'overview' | 'schedules' | 'users' | 'tickets' {
    const operation = this.route.snapshot.paramMap.get('operation');
    return operation === 'schedules' || operation === 'users' || operation === 'tickets'
      ? operation
      : 'overview';
  }

  get operationTitle(): string {
    switch (this.activeOperation) {
      case 'schedules': return 'Schedule management';
      case 'users': return 'Passenger accounts';
      case 'tickets': return 'Ticket operations';
      default: return 'Operations overview';
    }
  }

  get operationDescription(): string {
    switch (this.activeOperation) {
      case 'schedules': return 'Publish trains, configure coaches, and manage ticket fares.';
      case 'users': return 'Create and manage passenger accounts.';
      case 'tickets': return 'Review ticket activity and booking status.';
      default: return 'Schedules, passengers, and reservations in one place.';
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/admin-login']);
      return;
    }
    this.ticketService.getAdminTickets().subscribe({
      next: (tickets) => this.tickets = tickets,
      error: (error) => this.message = error.error?.message ?? 'Could not load tickets.'
    });
    this.loadUsers();
    this.loadTrains();
  }

  saveSchedule(): void {
    this.message = '';
    if (!this.train.trainNo.trim() || !this.train.source.trim() || !this.train.destination.trim() || !this.train.journeyDate) {
      this.message = 'Complete all train and journey details.';
      return;
    }
    if (!Number.isFinite(this.train.ticketFare) || this.train.ticketFare <= 0 ||
      Math.round(this.train.ticketFare * 100) !== this.train.ticketFare * 100) {
      this.message = 'Enter a ticket fare greater than zero with no more than two decimal places.';
      return;
    }

    const coaches = this.buildCoachConfiguration();
    if (!coaches.length) {
      this.message = 'Add at least one coach to publish a schedule.';
      return;
    }
    if (this.coachTypes.some((type) =>
      !Number.isInteger(this.coachCounts[type]) ||
      this.coachCounts[type] < 0 ||
      !Number.isInteger(this.seatsPerCoach[type]) ||
      this.seatsPerCoach[type] < 1
    )) {
      this.message = 'Coach counts must be whole numbers of zero or more, and seats per coach must be positive whole numbers.';
      return;
    }

    this.isSavingSchedule = true;
    const request: TrainScheduleRequest = { ...this.train, coaches };
    const saveRequest = this.editingScheduleId === null
      ? this.ticketService.createTrain(request)
      : this.ticketService.updateTrainCoaches(this.editingScheduleId, coaches);

    saveRequest.subscribe({
      next: (created) => {
        const wasEditing = this.editingScheduleId !== null;
        this.isSavingSchedule = false;
        this.trains = !wasEditing
          ? [created, ...this.trains]
          : this.trains.map((schedule) => schedule.id === created.id ? created : schedule);
        this.resetScheduleForm();
        this.message = wasEditing ? 'Coach configuration updated.' : 'Train schedule created.';
      },
      error: (error) => {
        this.isSavingSchedule = false;
        this.message = error.error?.message ?? 'Could not save schedule.';
      }
    });
  }

  editCoaches(schedule: TrainSchedule): void {
    if (schedule.id === undefined || schedule.id === null) {
      this.message = 'This schedule does not include an ID required for coach updates.';
      return;
    }
    this.editingScheduleId = schedule.id;
    this.train = {
      trainNo: schedule.trainNo,
      source: schedule.source,
      destination: schedule.destination,
      journeyDate: schedule.journeyDate,
      ticketFare: schedule.ticketFare
    };
    this.coachCounts = this.createCoachCounts();
    this.seatsPerCoach = { ...this.defaultSeatsPerCoach };
    for (const coach of schedule.coaches ?? []) {
      this.coachCounts[coach.coachType] = coach.coachCount ?? 0;
      this.seatsPerCoach[coach.coachType] = coach.seatsPerCoach ?? this.defaultSeatsPerCoach[coach.coachType];
    }
    this.message = `Editing coaches for train ${schedule.trainNo}.`;
  }

  cancelEdit(): void {
    this.resetScheduleForm();
    this.message = '';
  }

  saveFare(schedule: TrainSchedule): void {
    if (!Number.isFinite(this.fareUpdates[schedule.id]) || this.fareUpdates[schedule.id] <= 0 ||
      Math.round(this.fareUpdates[schedule.id] * 100) !== this.fareUpdates[schedule.id] * 100) {
      this.message = 'Enter a ticket fare greater than zero with no more than two decimal places.';
      return;
    }
    this.message = '';
    this.savingFareScheduleId = schedule.id;
    this.ticketService.updateTrainFare(schedule.id, this.fareUpdates[schedule.id]).subscribe({
      next: (updated) => {
        this.trains = this.trains.map((item) => item.id === updated.id ? updated : item);
        this.fareUpdates[updated.id] = updated.ticketFare;
        this.savingFareScheduleId = null;
        this.message = `Ticket fare for train ${updated.trainNo} updated to ₹${updated.ticketFare.toFixed(2)}.`;
      },
      error: (error) => {
        this.savingFareScheduleId = null;
        this.message = this.errorMessage(error, 'Could not update ticket fare.');
      }
    });
  }

  createUser(): void {
    this.userMessage = '';
    this.isUserMessageError = false;
    this.isSavingUser = true;
    this.authService.createAdminUser({
      fullName: this.newUser.fullName.trim(),
      email: this.newUser.email.trim(),
      phone: this.newUser.phone.trim(),
      password: this.newUser.password
    }).subscribe({
      next: (user) => {
        this.isSavingUser = false;
        this.users = [...this.users, user].sort((a, b) => a.fullName.localeCompare(b.fullName));
        this.newUser = this.createEmptyUser();
        this.userMessage = `Account created for ${user.fullName}; ₹100 wallet bonus credited.`;
      },
      error: (error) => {
        this.isSavingUser = false;
        this.isUserMessageError = true;
        this.userMessage = this.errorMessage(error, 'Could not create the user account.');
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (this.deletingUserId !== null || !window.confirm(
      `Permanently delete ${user.fullName}'s account, wallet history, and ticket records? This cannot be undone.`
    )) {
      return;
    }

    this.userMessage = '';
    this.isUserMessageError = false;
    this.deletingUserId = user.id;
    this.authService.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((item) => item.id !== user.id);
        this.deletingUserId = null;
        this.userMessage = `Account for ${user.fullName} was removed.`;
      },
      error: (error) => {
        this.deletingUserId = null;
        this.isUserMessageError = true;
        this.userMessage = this.errorMessage(error, 'Could not remove the user account.');
      }
    });
  }

  private loadTrains(): void {
    this.ticketService.getAdminTrains().subscribe({
      next: (trains) => {
        this.trains = trains;
        this.fareUpdates = Object.fromEntries(trains.map((train) => [train.id, train.ticketFare]));
      },
      error: (error) => this.message = error.error?.message ?? 'Could not load schedules.'
    });
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.authService.getAdminUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
      },
      error: (error) => {
        this.isLoadingUsers = false;
        this.isUserMessageError = true;
        this.userMessage = this.errorMessage(error, 'Could not load registered users.');
      }
    });
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }

  private buildCoachConfiguration(): CoachConfiguration[] {
    return this.coachTypes
      .filter((type) => this.coachCounts[type] > 0)
      .map((coachType) => ({
        coachType,
        coachCount: this.coachCounts[coachType],
        seatsPerCoach: this.seatsPerCoach[coachType]
      }));
  }

  private resetScheduleForm(): void {
    this.editingScheduleId = null;
    this.train = this.createEmptyTrain();
    this.coachCounts = this.createCoachCounts();
    this.seatsPerCoach = { ...this.defaultSeatsPerCoach };
  }

  private createEmptyTrain(): Omit<TrainScheduleRequest, 'coaches'> {
    return { trainNo: '', source: '', destination: '', journeyDate: '', ticketFare: 100 };
  }

  private createEmptyUser(): RegisterRequest {
    return { fullName: '', email: '', phone: '', password: '' };
  }

  private createCoachCounts(): Record<CoachType, number> {
    return { SL: 0, '3AC': 0, '2AC': 0, '1AC': 0 };
  }
}
