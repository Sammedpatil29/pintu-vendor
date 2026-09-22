import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, VendorUser } from '../models/vendor.model';

const TOKEN_KEY = 'pintu_vendor_token';
const USER_KEY = 'pintu_vendor_user';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email?: string;
  cleanEmail?: string;
  notRegistered?: boolean;
  notActive?: boolean;
  devOtp?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000';

  private currentUserSubject = new BehaviorSubject<VendorUser | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isStoreOpenSubject = new BehaviorSubject<boolean>(this.getInitialStoreStatus());
  public isStoreOpen$ = this.isStoreOpenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getStoredUser(): VendorUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getInitialStoreStatus(): boolean {
    const user = this.getStoredUser();
    return user?.store?.isOpen ?? true;
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && token.trim().length > 0;
  }

  public getCurrentUser(): VendorUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Request OTP for registered Vendor Phone number.
   * If not registered, backend returns 404 { notRegistered: true }.
   */
  public sendOtp(phone: string): Observable<SendOtpResponse> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    return this.http.post<SendOtpResponse>(`${this.apiUrl}/api/vendor/send-otp`, {
      phone: cleanPhone,
      mobileNumber: cleanPhone,
    }).pipe(
      catchError((err) => {
        const errorBody = err?.error || {};
        return throwError(() => ({
          status: err.status,
          notRegistered: errorBody.notRegistered === true || err.status === 404,
          notActive: errorBody.notActive === true || err.status === 403,
          message: errorBody.message || 'Failed to send verification code. Please check your connection and try again.',
        }));
      })
    );
  }

  /**
   * Verify OTP with backend
   */
  public verifyOtp(phone: string, otp: string): Observable<AuthResponse> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    return this.http.post<any>(`${this.apiUrl}/api/vendor/verify-otp`, {
      phone: cleanPhone,
      mobileNumber: cleanPhone,
      otp: cleanOtp,
    }).pipe(
      map((res) => {
        if (!res.success && !res.token) {
          throw new Error(res.message || 'Invalid verification code');
        }

        const user: VendorUser = res.user || {
          phone: cleanPhone,
          role: 'vendor',
          name: res.name || 'Vendor Merchant',
          store: res.store || {
            name: 'Pintu Merchant Store',
            category: 'grocery',
            phone: cleanPhone,
            isOpen: true,
          },
        };

        const token = res.token;
        this.saveSession(token, user);

        return {
          success: true,
          token,
          user,
        };
      }),
      catchError((err) => {
        const message = err?.error?.message || err?.message || 'Invalid or expired verification code';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Toggle Store Online/Offline status
   */
  public setStoreStatus(isOpen: boolean): void {
    const user = this.getCurrentUser();
    if (user && user.store) {
      user.store.isOpen = isOpen;
      this.saveSession(this.getToken() || '', user);
    }
    this.isStoreOpenSubject.next(isOpen);

    const token = this.getToken();
    if (token) {
      this.http.put(`${this.apiUrl}/api/vendor/status`, { is_open: isOpen }, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        error: (err: any) => console.warn('Could not sync store status with server:', err?.message)
      });
    }
  }

  /**
   * Save session to LocalStorage and update streams
   */
  public saveSession(token: string, user: VendorUser): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
      if (user.store) {
        this.isStoreOpenSubject.next(user.store.isOpen !== false);
      }
    }
  }

  /**
   * Logout vendor and clear storage
   */
  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ==========================================
  // VENDOR ONBOARDING & REGISTRATION
  // ==========================================

  /**
   * Request OTP for Vendor Onboarding / Registration Email
   */
  public sendRegistrationOtp(email: string): Observable<any> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<any>(`${this.apiUrl}/api/vendor/register/send-otp`, {
      email: cleanEmail,
    });
  }

  /**
   * Verify Registration OTP and check if draft exists
   */
  public verifyRegistrationOtp(email: string, otp: string): Observable<any> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<any>(`${this.apiUrl}/api/vendor/register/verify-otp`, {
      email: cleanEmail,
      otp: otp.trim(),
    });
  }

  /**
   * Save / update draft progress for verified email
   */
  public saveRegistrationDraft(email: string, formData: any, step?: number): Observable<any> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<any>(`${this.apiUrl}/api/vendor/register/save-draft`, {
      email: cleanEmail,
      formData,
      step,
    });
  }

  /**
   * Delete draft for email to start completely fresh
   */
  public deleteRegistrationDraft(email: string): Observable<any> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.delete<any>(`${this.apiUrl}/api/vendor/register/draft/${encodeURIComponent(cleanEmail)}`);
  }

  /**
   * Fetch dynamic onboarding metadata (service areas, services and document requirements)
   */
  public getRegistrationMetadata(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/vendor/register/metadata`);
  }

  /**
   * Check phone number availability
   */
  public checkPhoneAvailability(phone: string, email?: string): Observable<any> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const emailParam = email ? `&email=${encodeURIComponent(email.trim().toLowerCase())}` : '';
    return this.http.get<any>(`${this.apiUrl}/api/vendor/register/check-phone?phone=${cleanPhone}${emailParam}`);
  }

  /**
   * Final submission of vendor registration
   */
  public submitRegistration(email: string, formData: any): Observable<any> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<any>(`${this.apiUrl}/api/vendor/register/submit`, {
      email: cleanEmail,
      formData,
    });
  }
}
