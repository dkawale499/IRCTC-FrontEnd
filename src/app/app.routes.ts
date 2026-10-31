import { Routes } from '@angular/router';
import { AvailableTicketsComponent } from './available-tickets/available-tickets.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminComponent } from './admin/admin.component';
import { WalletDashboardComponent } from './wallet-dashboard/wallet-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', redirectTo: 'user-login', pathMatch: 'full' },
  { path: 'user-login', component: UserLoginComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'admin/:operation', component: AdminComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'available-tickets', component: AvailableTicketsComponent },
  { path: 'booking', loadComponent: () => import('./booking-page/booking-page.component').then((module) => module.BookingPageComponent) },
  { path: 'wallet', component: WalletDashboardComponent },
  { path: 'wallet/about', loadComponent: () => import('./wallet-about/wallet-about.component').then((module) => module.WalletAboutComponent) },
  { path: '**', redirectTo: '' }
];
