import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../auth.service';
import { WalletService, WalletSummary, WalletTransaction } from '../wallet.service';

type WalletFilter = 'All' | 'Failed' | 'Credit' | 'Debit' | 'Refund';

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [AppHeaderComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: './wallet-dashboard.component.html',
})
export class WalletDashboardComponent implements OnInit {
  summary: WalletSummary | null = null;
  activeTab: 'transactions' | 'bookings' = 'transactions';
  selectedFilter: WalletFilter = 'All';
  searchTerm = '';
  message = '';
  isLoading = true;
  balanceVisible = true;
  readonly filters: WalletFilter[] = ['All', 'Failed', 'Credit', 'Debit', 'Refund'];

  constructor(private readonly walletService: WalletService, private readonly authService: AuthService,
    private readonly router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.isAdmin()) {
      this.router.navigate(['/user-login']);
      return;
    }
    this.loadWallet();
  }

  get filteredTransactions(): WalletTransaction[] {
    const transactions = this.summary?.transactions ?? [];
    const search = this.searchTerm.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const type = transaction.type.toLowerCase();
      const matchesFilter = this.selectedFilter === 'All'
        || (this.selectedFilter === 'Failed' && transaction.status.toLowerCase() === 'failed')
        || type === this.selectedFilter.toLowerCase();
      const matchesSearch = !search
        || [transaction.id, transaction.description, transaction.status].some((value) =>
          String(value).toLowerCase().includes(search));
      return matchesFilter && matchesSearch;
    });
  }

  loadWallet(): void {
    this.isLoading = true;
    this.message = '';
    this.walletService.getWallet().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.message = this.readError(error, 'Could not load your wallet. Please try again.');
      }
    });
  }

  setFilter(filter: WalletFilter): void {
    this.selectedFilter = filter;
  }

  toggleBalance(): void {
    this.balanceVisible = !this.balanceVisible;
  }

  private readError(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
