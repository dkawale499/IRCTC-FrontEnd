import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface WalletTransaction {
  id: number;
  type: 'CREDIT' | 'DEBIT' | 'REFUND';
  description: string;
  createdAt: string;
  amount: number;
  balanceAfter: number;
  status: string;
}

export interface WalletSummary {
  balance: number;
  signupCreditTotal: number;
  totalTransactions: number;
  passengerName: string;
  email: string;
  phone: string;
  registeredAt: string | null;
  transactions: WalletTransaction[];
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(private readonly http: HttpClient) {}

  getWallet(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${environment.apiUrl}/wallet`);
  }
}
