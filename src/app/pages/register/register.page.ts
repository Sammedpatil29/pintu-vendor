import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular/lazy';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

export interface DocumentFieldMeta {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  pattern?: string;
  helpText?: string;
}

export interface ServiceMeta {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  documents: DocumentFieldMeta[];
}

export interface VendorRegistrationForm {
  // Step 1: Store Basics
  store_name: string;
  service_type: string;
  category: string;
  city: string;
  address: string;
  pincode: string;
  landmark: string;

  // Step 2: Merchant / Owner & Contact
  name: string;
  phone: string;
  alt_phone: string;
  email: string;

  // Step 3: Compliance & Documents
  pan_number: string;
  license_number: string;
  fssai_number: string;
  gst_number: string;
  documents: Record<string, string>;

  // Bank & Settlement
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Flow Gate: 'email' | 'otp' | 'draft_decision' | 'form' | 'submitted'
  gateState: 'email' | 'otp' | 'draft_decision' | 'form' | 'submitted' = 'email';

  // Multi-step form step (1: Store, 2: Merchant, 3: Compliance & Docs, 4: Review)
  currentFormStep: number = 1;

  // Email & OTP
  email: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  isLoading: boolean = false;
  isSavingDraft: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  lastSavedAt: Date | null = null;

  // Timer
  resendCountdown: number = 60;
  private timerRef: any = null;

  // Draft Data if found
  existingDraft: any = null;
  submittedStoreName: string = '';
  submittedRegId: string = '';

  // Dynamic Metadata loaded from backend
  cities: string[] = ['Bengaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Athani', 'Jamkhandi'];
  services: ServiceMeta[] = [];
  selectedServiceMeta: ServiceMeta | null = null;
  singleStoreNotice: any = {
    title: 'Initial Store Onboarding',
    message: 'You are registering your 1st primary store location. Multiple store outlets can be registered directly inside your merchant dashboard after activation.'
  };

  // Phone check status
  phoneCheckStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  phoneCheckMessage: string = '';
  private phoneDebounceTimer: any = null;

  // Form State
  form: VendorRegistrationForm = this.getInitialFormData();
  termsAccepted: boolean = false;

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOnboardingMetadata();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    if (this.phoneDebounceTimer) {
      clearTimeout(this.phoneDebounceTimer);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.cdr.detectChanges();
  }

  /**
   * Load active service areas and services with document schemas from backend
   */
  loadOnboardingMetadata(): void {
    this.authService.getRegistrationMetadata().subscribe({
      next: (res: any) => {
        if (res?.cities && Array.isArray(res.cities) && res.cities.length > 0) {
          this.cities = res.cities;
          if (!this.form.city || !this.cities.includes(this.form.city)) {
            this.form.city = this.cities[0];
          }
        }
        if (res?.services && Array.isArray(res.services) && res.services.length > 0) {
          this.services = res.services;
          this.selectService(this.form.service_type || this.services[0].id);
        }
        if (res?.singleStorePolicy) {
          this.singleStoreNotice = res.singleStorePolicy;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Using fallback onboarding metadata:', err?.message);
        this.initFallbackServices();
      }
    });
  }

  private initFallbackServices(): void {
    this.services = [
      {
        id: 'pharmacy',
        category: 'pharmacy',
        title: 'Pharmacy & Medicines',
        subtitle: 'Retail pharmacy, prescription drugs, OTC healthcare & wellness supplies',
        icon: 'medkit-outline',
        description: 'For licensed retail chemists, medical stores and pharmacies.',
        documents: [
          { key: 'drug_license_no', label: 'Drug License Number (Form 20 / 21)', placeholder: 'e.g. KA-DH-2024-DL-8812', required: true, helpText: 'Mandatory license under Drugs and Cosmetics Act.' },
          { key: 'pharmacist_name', label: 'Registered Pharmacist Full Name', placeholder: 'e.g. Anand Kulkarni', required: true },
          { key: 'pharmacist_reg_no', label: 'Pharmacist Council Reg. Number', placeholder: 'e.g. KSPC/2019/54821', required: true },
          { key: 'gst_number', label: 'GSTIN Number', placeholder: '15-digit GSTIN', required: true }
        ]
      },
      {
        id: 'lab_test',
        category: 'healthcare',
        title: 'Diagnostics & Pathology Lab',
        subtitle: 'Clinical blood tests, health packages, pathology & diagnostic home collection',
        icon: 'flask-outline',
        description: 'For pathology laboratories, diagnostic test centers and scan facilities.',
        documents: [
          { key: 'clinical_establishment_no', label: 'Clinical Establishment Act License', placeholder: 'e.g. CEA/KA/2023/1109', required: true },
          { key: 'pathologist_name', label: 'Consulting Pathologist / Lab Director', placeholder: 'Dr. Pathologist Name', required: true },
          { key: 'pathologist_reg_no', label: 'Medical Council Reg. Number of Pathologist', placeholder: 'e.g. KMC/2015/8834', required: true },
          { key: 'bmw_number', label: 'Bio-Medical Waste (BMW) Authorization No.', placeholder: 'e.g. BMW/PCB/2024/772', required: true },
          { key: 'gst_number', label: 'GSTIN Number', placeholder: '15-digit GSTIN', required: true }
        ]
      },
      {
        id: 'doctor',
        category: 'healthcare',
        title: 'Doctor & Medical Clinic',
        subtitle: 'Doctor consultations, clinic appointments, OPD care & patient diagnosis',
        icon: 'pulse-outline',
        description: 'For registered medical practitioners, specialized doctors and polyclinics.',
        documents: [
          { key: 'medical_council_no', label: 'State Medical Council (SMC) / NMC Reg. No.', placeholder: 'e.g. KMC/2012/48192', required: true },
          { key: 'medical_degree', label: 'Highest Medical Degree & Specialization', placeholder: 'e.g. MBBS, MD (General Medicine)', required: true },
          { key: 'clinic_reg_no', label: 'Clinic / Establishment Reg. Number (Optional)', placeholder: 'e.g. CLN/2022/9401', required: false },
          { key: 'pan_number', label: 'Doctor / Clinic PAN Card', placeholder: '10-digit PAN', required: true }
        ]
      },
      {
        id: 'restaurant',
        category: 'food',
        title: 'Food, Restaurant & Dineout',
        subtitle: 'Restaurants, cafes, cloud kitchens, fast food, bakeries & dining spots',
        icon: 'restaurant-outline',
        description: 'For dining establishments, cloud kitchens and commercial food makers.',
        documents: [
          { key: 'fssai_number', label: 'FSSAI Food License Number (14 Digits)', placeholder: '14-digit FSSAI License', required: true, pattern: '^[0-9]{14}$', helpText: 'Mandatory 14-digit FSSAI license.' },
          { key: 'trade_license_no', label: 'Municipal Trade License / Eating House No.', placeholder: 'e.g. TL/MUN/2023/5102', required: true },
          { key: 'pan_number', label: 'Business / Proprietor PAN Card', placeholder: '10-digit PAN', required: true },
          { key: 'gst_number', label: 'GSTIN Number (Optional)', placeholder: '15-digit GSTIN', required: false }
        ]
      },
      {
        id: 'grocery',
        category: 'daily needs',
        title: 'Grocery & Supermarket',
        subtitle: 'Daily essentials, FMCG, fresh fruits, vegetables & packaged provisions',
        icon: 'basket-outline',
        description: 'For supermarkets, kirana stores, marts and provision stores.',
        documents: [
          { key: 'fssai_number', label: 'FSSAI Registration Number (14 Digits)', placeholder: '14-digit FSSAI Number', required: true, pattern: '^[0-9]{14}$' },
          { key: 'trade_license_no', label: 'Shop & Establishment Act Certificate / Gumasta', placeholder: 'e.g. SE/ACT/2022/8812', required: true },
          { key: 'pan_number', label: 'Business / Proprietor PAN Card', placeholder: '10-digit PAN', required: true },
          { key: 'gst_number', label: 'GSTIN Number (Optional)', placeholder: '15-digit GSTIN', required: false }
        ]
      },
      {
        id: 'property',
        category: 'real estate',
        title: 'Properties & Real Estate',
        subtitle: 'Commercial properties, residential rentals, lands & verified broker listings',
        icon: 'business-outline',
        description: 'For certified real estate brokers, property managers and agencies.',
        documents: [
          { key: 'rera_number', label: 'RERA Agent / Agency Registration Number', placeholder: 'e.g. PRM/KA/RERA/1251/308/AG/2401', required: true },
          { key: 'pan_number', label: 'Proprietor / Agency PAN Card', placeholder: '10-digit PAN', required: true },
          { key: 'gst_number', label: 'GSTIN Number (Optional)', placeholder: '15-digit GSTIN', required: false }
        ]
      },
      {
        id: 'store',
        category: 'retail',
        title: 'Retail & Specialty Store',
        subtitle: 'Fashion, electronics, mobile accessories, books, gifts & stationery',
        icon: 'bag-handle-outline',
        description: 'For general retail stores selling physical non-food goods.',
        documents: [
          { key: 'trade_license_no', label: 'Shop & Commercial Establishment Registration', placeholder: 'e.g. SE/REG/2023/4491', required: true },
          { key: 'pan_number', label: 'Proprietor / Business PAN Card', placeholder: '10-digit PAN', required: true },
          { key: 'gst_number', label: 'GSTIN Number (Optional)', placeholder: '15-digit GSTIN', required: false }
        ]
      }
    ];
    this.selectService('grocery');
  }

  selectService(serviceId: string): void {
    this.form.service_type = serviceId;
    const found = this.services.find(s => s.id === serviceId);
    this.selectedServiceMeta = found || null;
    if (found) {
      this.form.category = found.category;
      if (!this.form.documents) {
        this.form.documents = {};
      }
      // Populate keys if not set
      found.documents.forEach(d => {
        if (this.form.documents[d.key] === undefined) {
          this.form.documents[d.key] = '';
        }
      });
    }
    this.cdr.detectChanges();
  }

  private getInitialFormData(): VendorRegistrationForm {
    return {
      store_name: '',
      service_type: 'grocery',
      category: 'daily needs',
      city: 'Hubballi',
      address: '',
      pincode: '',
      landmark: '',
      name: '',
      phone: '',
      alt_phone: '',
      email: '',
      pan_number: '',
      license_number: '',
      fssai_number: '',
      gst_number: '',
      documents: {},
      bank_name: '',
      account_holder: '',
      account_number: '',
      ifsc_code: '',
    };
  }

  // ========================================================
  // 1. TOP OF FORM: EMAIL & OTP VERIFICATION
  // ========================================================

  isEmailValid(): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(this.email.trim());
  }

  sendOtp(): void {
    if (!this.isEmailValid() || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.sendRegistrationOtp(this.email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.gateState = 'otp';
        this.otpDigits = ['', '', '', '', '', ''];
        this.startTimer();
        this.showToast(res?.message || 'Verification code sent to your email!');

        // Focus first OTP input on next tick
        setTimeout(() => {
          const first = this.otpInputs?.first?.nativeElement;
          if (first) first.focus();
        }, 300);

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Failed to send verification code. Please try again.';
        this.errorMessage = msg;
        this.showToast(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  startTimer(): void {
    this.clearTimer();
    this.resendCountdown = 60;
    this.timerRef = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
        this.cdr.detectChanges();
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  resendOtp(): void {
    if (this.resendCountdown > 0 || this.isLoading) return;
    this.sendOtp();
  }

  onOtpInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;

    // Handle full paste
    if (val && val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (i < 6) this.otpDigits[i] = d;
      });
      const targetIdx = Math.min(digits.length, 5);
      const inputs = this.otpInputs.toArray();
      if (inputs[targetIdx]) {
        inputs[targetIdx].nativeElement.focus();
      }
      if (this.isOtpComplete()) {
        this.verifyOtp();
      }
      this.cdr.detectChanges();
      return;
    }

    const cleanChar = val.replace(/\D/g, '');
    this.otpDigits[index] = cleanChar;

    if (cleanChar && index < 5) {
      const inputs = this.otpInputs.toArray();
      if (inputs[index + 1]) {
        inputs[index + 1].nativeElement.focus();
      }
    }

    if (this.isOtpComplete()) {
      this.verifyOtp();
    }
    this.cdr.detectChanges();
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        const inputs = this.otpInputs.toArray();
        if (inputs[index - 1]) {
          inputs[index - 1].nativeElement.focus();
          this.otpDigits[index - 1] = '';
        }
      } else {
        this.otpDigits[index] = '';
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d !== '' && d.length === 1);
  }

  verifyOtp(): void {
    if (!this.isOtpComplete() || this.isLoading) return;

    const fullOtp = this.otpDigits.join('');
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyRegistrationOtp(this.email, fullOtp).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.clearTimer();

        // Bind verified email to form
        this.form.email = this.email.trim().toLowerCase();

        // Check if draft exists
        if (res.hasDraft && res.draft) {
          this.existingDraft = res.draft;
          this.gateState = 'draft_decision';
          this.showToast('We found a saved registration draft for your email!');
        } else {
          // No draft exists -> start fresh form
          this.existingDraft = null;
          this.form = this.getInitialFormData();
          this.form.email = this.email.trim().toLowerCase();
          if (this.cities.length > 0) {
            this.form.city = this.cities[0];
          }
          if (this.services.length > 0) {
            this.selectService(this.services[0].id);
          }
          this.currentFormStep = 1;
          this.gateState = 'form';
          this.showToast('Email verified! Please fill out your store details.');
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Invalid or expired verification code.';
        this.errorMessage = msg;
        this.showToast(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  // ========================================================
  // 2. DRAFT DECISION ACTIONS: RESUME OR DELETE
  // ========================================================

  resumeDraft(): void {
    if (!this.existingDraft) return;

    const draftData = this.existingDraft.draft_data || {};
    const serviceType = draftData.service_type || this.existingDraft.service_type || this.existingDraft.category || 'grocery';

    this.form = {
      store_name: draftData.store_name || this.existingDraft.store_name || '',
      service_type: serviceType,
      category: draftData.category || this.existingDraft.category || 'daily needs',
      city: draftData.city || this.existingDraft.city || 'Hubballi',
      address: draftData.address || this.existingDraft.address || '',
      pincode: draftData.pincode || this.existingDraft.pincode || '',
      landmark: draftData.landmark || '',
      name: draftData.name || this.existingDraft.name || '',
      phone: draftData.phone || this.existingDraft.phone || '',
      alt_phone: draftData.alt_phone || '',
      email: this.email.trim().toLowerCase(),
      pan_number: draftData.pan_number || this.existingDraft.pan_number || '',
      license_number: draftData.license_number || this.existingDraft.license_number || '',
      fssai_number: draftData.fssai_number || this.existingDraft.fssai_number || '',
      gst_number: draftData.gst_number || this.existingDraft.gst_number || '',
      documents: draftData.documents || this.existingDraft.documents || {},
      bank_name: draftData.bank_name || draftData.bank_details?.bank_name || '',
      account_holder: draftData.account_holder || draftData.bank_details?.account_holder || '',
      account_number: draftData.account_number || draftData.bank_details?.account_number || '',
      ifsc_code: draftData.ifsc_code || draftData.bank_details?.ifsc_code || '',
    };

    this.selectService(serviceType);

    // If phone exists, validate it
    if (this.form.phone && this.form.phone.length === 10) {
      this.onPhoneInput();
    }

    if (this.existingDraft.updatedAt) {
      this.lastSavedAt = new Date(this.existingDraft.updatedAt);
    }

    this.currentFormStep = Math.min(Math.max(this.existingDraft.step || 1, 1), 4);
    this.gateState = 'form';
    this.showToast(`Resumed draft for "${this.form.store_name || 'your store'}"`);
    this.cdr.detectChanges();
  }

  async confirmDeleteDraft(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Saved Draft?',
      message: 'Are you sure you want to delete your saved draft? All progress will be removed and you will start with a fresh blank form.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete Draft',
          role: 'destructive',
          handler: () => {
            this.executeDeleteDraft();
          },
        },
      ],
    });

    await alert.present();
  }

  private executeDeleteDraft(): void {
    this.isLoading = true;
    this.authService.deleteRegistrationDraft(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.existingDraft = null;
        this.form = this.getInitialFormData();
        this.form.email = this.email.trim().toLowerCase();
        if (this.cities.length > 0) this.form.city = this.cities[0];
        if (this.services.length > 0) this.selectService(this.services[0].id);
        this.currentFormStep = 1;
        this.lastSavedAt = null;
        this.phoneCheckStatus = 'idle';
        this.phoneCheckMessage = '';
        this.gateState = 'form';
        this.showToast('Draft deleted. You are now starting with a fresh registration form.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showToast(err?.error?.message || 'Could not delete draft. Please try again.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  // ========================================================
  // 3. MULTI-STEP FORM NAVIGATION & DRAFT SAVING
  // ========================================================

  onPhoneInput(): void {
    const clean = this.form.phone.replace(/\D/g, '').slice(-10);
    this.form.phone = clean;

    if (this.phoneDebounceTimer) {
      clearTimeout(this.phoneDebounceTimer);
    }

    if (clean.length < 10) {
      this.phoneCheckStatus = 'idle';
      this.phoneCheckMessage = '';
      return;
    }

    if (clean.length === 10) {
      this.phoneCheckStatus = 'checking';
      this.phoneCheckMessage = 'Checking mobile availability...';
      this.phoneDebounceTimer = setTimeout(() => {
        this.authService.checkPhoneAvailability(clean, this.email).subscribe({
          next: (res: any) => {
            if (res.available) {
              this.phoneCheckStatus = 'available';
              this.phoneCheckMessage = 'Mobile number is available';
            } else {
              this.phoneCheckStatus = 'taken';
              this.phoneCheckMessage = res.message || 'Mobile number is already registered';
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.phoneCheckStatus = 'idle';
            this.phoneCheckMessage = '';
            this.cdr.detectChanges();
          }
        });
      }, 350);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentFormStep) {
      this.currentFormStep = step;
      this.cdr.detectChanges();
      return;
    }
    // Validate current before advancing
    if (this.validateStep(this.currentFormStep)) {
      this.saveProgress(false);
      this.currentFormStep = step;
      this.cdr.detectChanges();
    }
  }

  nextStep(): void {
    if (!this.validateStep(this.currentFormStep)) return;

    // Auto-save draft on step transition
    this.saveProgress(false);

    if (this.currentFormStep < 4) {
      this.currentFormStep++;
      this.cdr.detectChanges();
    }
  }

  prevStep(): void {
    if (this.currentFormStep > 1) {
      this.currentFormStep--;
      this.cdr.detectChanges();
    }
  }

  validateStep(step: number): boolean {
    if (step === 1) {
      if (!this.form.store_name.trim()) {
        this.showToast('Please enter your Store / Shop Name', 'warning');
        return false;
      }
      if (!this.form.service_type) {
        this.showToast('Please select a Primary Service Category', 'warning');
        return false;
      }
      if (!this.form.city) {
        this.showToast('Please select your Operating City', 'warning');
        return false;
      }
      if (!this.form.address.trim()) {
        this.showToast('Please enter the Full Store Address', 'warning');
        return false;
      }
      if (!this.form.pincode.trim() || !/^\d{6}$/.test(this.form.pincode.trim())) {
        this.showToast('Please enter a valid 6-digit Pincode', 'warning');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!this.form.name.trim()) {
        this.showToast('Please enter Merchant / Owner Name', 'warning');
        return false;
      }
      const phoneDigits = this.form.phone.replace(/\D/g, '').slice(-10);
      if (phoneDigits.length !== 10) {
        this.showToast('Please enter a valid 10-digit Mobile Number', 'warning');
        return false;
      }
      if (this.phoneCheckStatus === 'taken') {
        this.showToast(this.phoneCheckMessage || 'This mobile number is already registered with another vendor.', 'danger');
        return false;
      }
      return true;
    }

    if (step === 3) {
      // Dynamic service document validation
      if (this.selectedServiceMeta && this.selectedServiceMeta.documents) {
        for (const doc of this.selectedServiceMeta.documents) {
          const val = (this.form.documents[doc.key] || '').trim();
          if (doc.required && !val) {
            this.showToast(`Please enter: ${doc.label}`, 'warning');
            return false;
          }
          if (doc.pattern && val && !new RegExp(doc.pattern).test(val)) {
            this.showToast(`Invalid format for ${doc.label}`, 'warning');
            return false;
          }
        }
      }

      // Bank IFSC check if account number is provided
      if (this.form.account_number.trim()) {
        if (!this.form.ifsc_code.trim()) {
          this.showToast('Please enter Bank IFSC Code for payouts', 'warning');
          return false;
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(this.form.ifsc_code.trim().toUpperCase())) {
          this.showToast('Please enter a valid 11-character IFSC Code (e.g. SBIN0001234)', 'warning');
          return false;
        }
      }
      return true;
    }

    return true;
  }

  saveProgress(showNotification: boolean = true): void {
    if (!this.email || this.isSavingDraft) return;

    this.isSavingDraft = true;

    // Sync shortcut document fields
    this.syncDocumentFields();

    this.authService.saveRegistrationDraft(this.email, this.form, this.currentFormStep).subscribe({
      next: () => {
        this.isSavingDraft = false;
        this.lastSavedAt = new Date();
        if (showNotification) {
          const timeStr = this.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          this.showToast(`Draft progress saved (${timeStr})`);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSavingDraft = false;
        if (showNotification) {
          this.showToast(err?.error?.message || 'Could not save draft. Please check your connection.', 'danger');
        }
        this.cdr.detectChanges();
      },
    });
  }

  private syncDocumentFields(): void {
    if (this.form.documents) {
      if (this.form.documents['fssai_number']) {
        this.form.fssai_number = this.form.documents['fssai_number'];
      }
      if (this.form.documents['gst_number']) {
        this.form.gst_number = this.form.documents['gst_number'];
      }
      if (this.form.documents['pan_number']) {
        this.form.pan_number = this.form.documents['pan_number'];
      }
    }
  }

  // ========================================================
  // 4. SUBMIT APPLICATION
  // ========================================================

  submitRegistration(): void {
    if (!this.validateStep(1) || !this.validateStep(2) || !this.validateStep(3)) {
      return;
    }

    if (!this.termsAccepted) {
      this.showToast('Please accept the Partner Agreement terms to submit', 'warning');
      return;
    }

    this.isSubmitting = true;
    this.syncDocumentFields();

    this.authService.submitRegistration(this.email, this.form).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.submittedStoreName = res?.store_name || this.form.store_name;
        this.submittedRegId = res?.registrationId || 'PNT-' + Math.floor(100000 + Math.random() * 900000);
        this.gateState = 'submitted';
        this.showToast('Registration application submitted successfully!');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message || 'Failed to submit registration. Please try again.';
        this.showToast(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  changeEmail(): void {
    this.clearTimer();
    this.gateState = 'email';
    this.otpDigits = ['', '', '', '', '', ''];
    this.cdr.detectChanges();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getServiceLabel(val: string): string {
    const item = this.services.find((s) => s.id === val);
    return item ? item.title : val;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3400,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }
}
