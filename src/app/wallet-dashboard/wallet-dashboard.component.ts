import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../auth.service';
import { WalletService, WalletSummary, WalletTransaction } from '../wallet.service';

type WalletFilter = 'All' | 'Failed' | 'Credit' | 'Debit' | 'Refund';
type PaymentMethod = 'Credit card' | 'Debit card' | 'UPI' | 'Paytm' | 'Net banking';

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [AppHeaderComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: './wallet-dashboard.component.html',
})
export class WalletDashboardComponent implements OnDestroy, OnInit {
  summary: WalletSummary | null = null;
  activeTab: 'transactions' | 'bookings' = 'transactions';
  selectedFilter: WalletFilter = 'All';
  searchTerm = '';
  message = '';
  isLoading = true;
  balanceVisible = true;
  isTopUpDialogOpen = false;
  paymentCompleted = false;
  isPaymentProcessing = false;
  topUpAmount = 500;
  selectedPaymentMethod: PaymentMethod | null = null;
  qrImage = '';
  countdown = 10;
  paymentError = '';
  readonly filters: WalletFilter[] = ['All', 'Failed', 'Credit', 'Debit', 'Refund'];
  readonly quickAmounts = [500, 1000, 2000, 5000];
  readonly paymentMethods: { name: PaymentMethod; icon: string; detail: string }[] = [
    { name: 'Credit card', icon: 'CC', detail: 'Visa, Mastercard, RuPay' },
    { name: 'Debit card', icon: 'DC', detail: 'All major debit cards' },
    { name: 'UPI', icon: 'UPI', detail: 'Scan a demo QR code' },
    { name: 'Paytm', icon: 'P', detail: 'Paytm wallet (demo)' },
    { name: 'Net banking', icon: 'NB', detail: 'All major banks' },
  ];
  private paymentTimer: ReturnType<typeof setInterval> | null = null;
  private qrGenerationToken = 0;

  constructor(private readonly walletService: WalletService, private readonly authService: AuthService,
    private readonly router: Router) {}

  get isTopUpAmountValid(): boolean {
    return Number.isInteger(this.topUpAmount) && this.topUpAmount >= 1 && this.topUpAmount <= 100000;
  }

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

  ngOnDestroy(): void {
    this.stopPaymentTimer();
    this.qrGenerationToken += 1;
  }

  setFilter(filter: WalletFilter): void {
    this.selectedFilter = filter;
  }

  toggleBalance(): void {
    this.balanceVisible = !this.balanceVisible;
  }

  openTopUpDialog(): void {
    this.isTopUpDialogOpen = true;
    this.paymentCompleted = false;
    this.isPaymentProcessing = false;
    this.topUpAmount = 500;
    this.selectedPaymentMethod = null;
    this.qrImage = '';
    this.paymentError = '';
    this.countdown = 10;
  }

  closeTopUpDialog(): void {
    this.stopPaymentTimer();
    this.qrGenerationToken += 1;
    this.isTopUpDialogOpen = false;
    this.paymentCompleted = false;
    this.isPaymentProcessing = false;
    this.selectedPaymentMethod = null;
    this.qrImage = '';
    this.paymentError = '';
  }

  selectQuickAmount(amount: number): void {
    this.topUpAmount = amount;
    this.onTopUpAmountChange();
  }

  onTopUpAmountChange(): void {
    if (this.selectedPaymentMethod === 'UPI') {
      this.selectPaymentMethod('UPI');
    } else {
      this.paymentError = '';
    }
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.stopPaymentTimer();
    this.isPaymentProcessing = false;
    this.selectedPaymentMethod = method;
    this.paymentError = '';
    this.qrImage = '';
    this.countdown = 10;
    if (method === 'UPI') {
      void this.createDemoQr();
    }
  }

  startDemoPayment(): void {
    if (this.isPaymentProcessing) {
      return;
    }
    if (!this.selectedPaymentMethod) {
      this.paymentError = 'Choose a payment method to continue.';
      return;
    }
    if (!this.isTopUpAmountValid) {
      this.paymentError = 'Enter an amount between ₹1 and ₹1,00,000.';
      return;
    }
    this.paymentError = '';
    this.countdown = 10;
    this.isPaymentProcessing = true;
    this.stopPaymentTimer();
    this.paymentTimer = setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        this.stopPaymentTimer();
        this.completeDemoPayment();
      }
    }, 1000);
  }

  private async createDemoQr(): Promise<void> {
    const requestToken = ++this.qrGenerationToken;
    if (!this.isTopUpAmountValid) {
      this.paymentError = 'Enter an amount between ₹1 and ₹1,00,000 to create a QR code.';
      return;
    }

    const reference = `RW${Date.now()}`;
    const payload = `RAILWISE-DEMO:TOPUP:${this.topUpAmount}:INR:${reference}`;
    try {
      const qrImage = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 180,
        color: { dark: '#142a50', light: '#ffffff' },
      });
      if (requestToken !== this.qrGenerationToken || !this.isTopUpDialogOpen
        || this.selectedPaymentMethod !== 'UPI') {
        return;
      }
      this.qrImage = qrImage;
      this.startDemoPayment();
    } catch (error) {
      if (requestToken !== this.qrGenerationToken) {
        return;
      }
      this.paymentError = error instanceof Error
        ? `Could not generate the demo QR code: ${error.message}`
        : 'Could not generate the demo QR code.';
    }
  }

  private completeDemoPayment(): void {
    this.isPaymentProcessing = false;
    if (!this.summary || !this.selectedPaymentMethod) {
      return;
    }
    const balance = this.summary.balance + this.topUpAmount;
    const transaction: WalletTransaction = {
      id: Date.now(),
      type: 'CREDIT',
      description: `Demo wallet top-up (${this.selectedPaymentMethod})`,
      createdAt: new Date().toISOString(),
      amount: this.topUpAmount,
      balanceAfter: balance,
      status: 'SUCCESS',
    };
    this.summary = {
      ...this.summary,
      balance,
      totalTransactions: this.summary.totalTransactions + 1,
      transactions: [transaction, ...this.summary.transactions],
    };
    this.paymentCompleted = true;
  }

  private stopPaymentTimer(): void {
    if (this.paymentTimer !== null) {
      clearInterval(this.paymentTimer);
      this.paymentTimer = null;
    }
  }

  private readError(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
