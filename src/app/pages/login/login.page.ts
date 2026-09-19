import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular/lazy';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Step state: 'phone' | 'otp'
  currentStep: 'phone' | 'otp' = 'phone';

  phoneNumber: string = '';
  registeredEmail: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Timer
  resendCountdown: number = 60;
  private timerRef: any = null;

  private returnUrl: string = '/layout/dashboard';

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/layout/dashboard';
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  trackByIndex(index: number): number {
    return index;
  }

  // --- Step 1: Phone Request ---
  onPhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let cleaned = input.value.replace(/\D/g, '');
    if (cleaned.length > 10 && (cleaned.startsWith('91') || cleaned.startsWith('0'))) {
      if (cleaned.startsWith('91')) cleaned = cleaned.slice(2);
      else if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    }
    cleaned = cleaned.slice(0, 10);
    this.phoneNumber = cleaned;
    input.value = cleaned;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  isValidPhone(): boolean {
    return /^[6-9]\d{9}$/.test(this.phoneNumber);
  }

  requestOtp(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (!this.isValidPhone()) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.sendOtp(this.phoneNumber).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.registeredEmail = res.email || '';
        this.currentStep = 'otp';
        this.otpDigits = ['', '', '', '', '', ''];
        this.cdr.detectChanges();

        this.startResendTimer();
        this.showToast(res.message || 'OTP sent to registered email');

        // Focus first OTP field after view updates
        setTimeout(() => {
          const first = this.otpInputs?.first?.nativeElement;
          if (first) first.focus();
        }, 150);
      },
      error: async (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        if (err?.notRegistered) {
          await this.showNotRegisteredAlert();
        } else if (err?.notActive) {
          await this.showCustomAlert('Account Paused', err.message);
        } else {
          this.errorMessage = err?.message || 'Failed to send OTP. Please check your network and try again.';
          this.cdr.detectChanges();
        }
      },
    });
  }

  private async showNotRegisteredAlert(): Promise<void> {
    try {
      const alert = await this.alertCtrl.create({
        header: 'Vendor Not Registered',
        subHeader: `+91 ${this.phoneNumber}`,
        message: 'This mobile number is not registered as a Pintu Vendor partner. Please contact Pintu Admin or Partner Support to register and onboard your store.',
        backdropDismiss: false,
        cssClass: 'pintu-custom-alert',
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
            handler: () => {
              this.errorMessage = 'Mobile number not registered. Please contact support.';
              this.cdr.detectChanges();
            },
          },
        ],
      });
      await alert.present();
    } catch {
      this.errorMessage = `Mobile number (+91 ${this.phoneNumber}) is not registered as a Pintu Vendor. Please contact support.`;
      this.cdr.detectChanges();
    }
  }

  private async showCustomAlert(header: string, message: string): Promise<void> {
    try {
      const alert = await this.alertCtrl.create({
        header,
        message,
        cssClass: 'pintu-custom-alert',
        buttons: ['OK'],
      });
      await alert.present();
    } catch {
      this.errorMessage = message;
      this.cdr.detectChanges();
    }
  }

  // --- Step 2: OTP Handling ---
  onOtpDigitInput(index: number, event: any): void {
    const val = event.target.value.replace(/\D/g, '');
    this.otpDigits[index] = val ? val.slice(-1) : '';
    event.target.value = this.otpDigits[index];
    this.cdr.detectChanges();

    if (val && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1]?.nativeElement;
      if (nextInput) nextInput.focus();
    }

    // Auto verify if all 6 filled
    if (this.isOtpComplete()) {
      this.verifyOtp();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        const prevInput = this.otpInputs.toArray()[index - 1]?.nativeElement;
        if (prevInput) {
          prevInput.focus();
          this.otpDigits[index - 1] = '';
          prevInput.value = '';
          this.cdr.detectChanges();
        }
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, idx) => {
      if (idx < 6) {
        this.otpDigits[idx] = d;
        const inputElem = this.otpInputs.toArray()[idx]?.nativeElement;
        if (inputElem) inputElem.value = d;
      }
    });
    this.cdr.detectChanges();

    if (this.isOtpComplete()) {
      this.verifyOtp();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d !== '');
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  verifyOtp(): void {
    if (!this.isOtpComplete()) {
      this.errorMessage = 'Please enter the complete 6-digit verification code';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.verifyOtp(this.phoneNumber, this.getOtpCode()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showToast('Welcome back to Pintu Vendor!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Invalid verification code. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  editPhoneNumber(): void {
    this.clearTimer();
    this.currentStep = 'phone';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  resendOtp(): void {
    if (this.resendCountdown > 0) return;
    this.requestOtp();
  }

  // --- Helpers ---
  private startResendTimer(): void {
    this.resendCountdown = 60;
    this.clearTimer();
    this.cdr.detectChanges();
    this.timerRef = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
        this.cdr.detectChanges();
      } else {
        this.clearTimer();
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  private async showToast(message: string): Promise<void> {
    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 3000,
        position: 'top',
        cssClass: 'pintu-toast',
        color: 'dark',
      });
      await toast.present();
    } catch {
      // Ignore toast presentation errors
    }
  }
}
