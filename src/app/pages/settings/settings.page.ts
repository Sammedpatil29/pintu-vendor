import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertController, ModalController } from '@ionic/angular/lazy';
import { AuthService } from '../../services/auth.service';
import { ThemeService, AppTheme } from '../../services/theme.service';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorUser, VendorStore } from '../../models/vendor.model';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-page">
      <!-- Store Profile Card (Dynamic based on selected Store) -->
      <div class="settings-card">
        <div class="card-header">
          <div class="store-icon">
            <ion-icon [name]="activeStore?.serviceIcon || 'storefront'"></ion-icon>
          </div>
          <div class="header-text-col">
            <div class="city-badge-row">
              <span class="city-name-tag">{{ activeStore?.city || 'Hubballi' }}</span>
              <span class="category-badge">{{ activeStore?.serviceLabel || 'Store' }}</span>
            </div>
            <h3 class="store-title">{{ activeStore?.name || 'My Store' }}</h3>
          </div>
          <button type="button" class="switch-store-header-btn" (click)="openStoreSwitcher()" title="Switch Store">
            <ion-icon name="swap-horizontal-outline"></ion-icon>
            <span>Switch</span>
          </button>
        </div>

        <div class="info-list">
          <div class="info-row">
            <span class="info-label">Operating City</span>
            <span class="info-val highlight-city">{{ activeStore?.city }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Store Address</span>
            <span class="info-val address-val">{{ activeStore?.address }} (PIN: {{ activeStore?.pincode }})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Service Domain</span>
            <span class="info-val">{{ activeStore?.serviceLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ activeStore?.licenseType || 'Regulatory License' }}</span>
            <span class="info-val license-code">{{ activeStore?.licenseNumber || 'Verified' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">GSTIN / Tax ID</span>
            <span class="info-val">{{ activeStore?.gstNumber || '29ABCDE1234F1Z5' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Store Hotline</span>
            <span class="info-val">+91 {{ activeStore?.phone || user?.phone }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Store Email</span>
            <span class="info-val">{{ activeStore?.email || 'store@pintu.com' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Merchant Owner</span>
            <span class="info-val">{{ user?.name || 'Merchant Owner' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Platform Role</span>
            <span class="info-val role-highlight">Verified Merchant</span>
          </div>
        </div>

        <div class="card-bottom-actions">
          <button type="button" class="switch-store-big-btn" (click)="openStoreSwitcher()">
            <ion-icon name="swap-horizontal-outline"></ion-icon>
            <span>Switch to Another Store / City</span>
          </button>
        </div>
      </div>

      <!-- Theme & Appearance Card -->
      <div class="settings-card theme-settings-card">
        <div class="section-title-row">
          <div class="title-icon">
            <ion-icon [name]="themeService.isDark() ? 'moon' : 'sunny'"></ion-icon>
          </div>
          <div class="appearance-header-text">
            <h4 class="appearance-title">Appearance &amp; Theme</h4>
            <p class="appearance-sub">Customize the visual interface of your merchant portal</p>
          </div>
        </div>

        <div class="theme-options-grid">
          <!-- Light Theme Option -->
          <button
            type="button"
            class="theme-card-option"
            [class.selected]="themeService.currentTheme() === 'light'"
            (click)="setTheme('light')"
          >
            <div class="theme-preview light-preview">
              <div class="preview-header"></div>
              <div class="preview-body">
                <div class="preview-line line-1"></div>
                <div class="preview-line line-2"></div>
              </div>
            </div>
            <div class="option-footer">
              <div class="radio-indicator"></div>
              <div class="option-meta">
                <span class="option-title">Light</span>
                <span class="option-desc">Clean &amp; crisp</span>
              </div>
            </div>
          </button>

          <!-- Dark Theme Option -->
          <button
            type="button"
            class="theme-card-option"
            [class.selected]="themeService.currentTheme() === 'dark'"
            (click)="setTheme('dark')"
          >
            <div class="theme-preview dark-preview">
              <div class="preview-header"></div>
              <div class="preview-body">
                <div class="preview-line line-1"></div>
                <div class="preview-line line-2"></div>
              </div>
            </div>
            <div class="option-footer">
              <div class="radio-indicator"></div>
              <div class="option-meta">
                <span class="option-title">Dark</span>
                <span class="option-desc">Default night view</span>
              </div>
            </div>
          </button>

          <!-- System Auto Option -->
          <button
            type="button"
            class="theme-card-option"
            [class.selected]="themeService.currentTheme() === 'system'"
            (click)="setTheme('system')"
          >
            <div class="theme-preview system-preview">
              <div class="preview-split-left"></div>
              <div class="preview-split-right"></div>
            </div>
            <div class="option-footer">
              <div class="radio-indicator"></div>
              <div class="option-meta">
                <span class="option-title">System</span>
                <span class="option-desc">Match device OS</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Logout Action Card with Confirmation Alert -->
      <div class="settings-card logout-card">
        <div class="card-actions">
          <button type="button" class="action-btn" (click)="confirmLogout()">
            <ion-icon name="log-out-outline"></ion-icon>
            <span>Sign Out of Vendor Hub</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .settings-card {
      background: var(--vendor-surface);
      border: 1px solid var(--vendor-border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: var(--vendor-card-shadow);
      transition: background-color 0.25s ease, border-color 0.25s ease;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--vendor-border);

      .store-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #a000e2 0%, #7900b2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(160, 0, 226, 0.35);
        flex-shrink: 0;
      }

      .header-text-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;

        .city-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;

          .city-name-tag {
            font-size: 11px;
            font-weight: 800;
            color: var(--pintu-primary);
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .category-badge {
            display: inline-block;
            width: fit-content;
            font-size: 10.5px;
            font-weight: 750;
            color: var(--pintu-primary);
            background: var(--pintu-primary-surface);
            padding: 2px 8px;
            border-radius: 999px;
          }
        }

        .store-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: var(--vendor-text-primary);
          letter-spacing: -0.3px;
        }
      }

      .switch-store-header-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 10px;
        background: var(--pintu-primary-surface);
        border: 1.5px solid var(--pintu-primary);
        color: var(--pintu-primary);
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--pintu-primary);
          color: #ffffff;
        }
      }
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 11px 16px;
      background: var(--vendor-surface-secondary);
      border: 1px solid var(--vendor-border-subtle);
      border-radius: 12px;
      transition: all 0.2s ease;

      .info-label {
        font-size: 13px;
        color: var(--vendor-text-secondary);
        font-weight: 600;
        white-space: nowrap;
      }

      .info-val {
        font-size: 13.5px;
        font-weight: 750;
        color: var(--vendor-text-primary);
        text-align: right;

        &.highlight-city {
          color: var(--pintu-primary);
        }

        &.license-code {
          font-family: monospace;
          font-size: 13px;
          color: var(--pintu-primary);
        }

        &.address-val {
          max-width: 320px;
          font-size: 12.5px;
          line-height: 1.3;
        }

        &.role-highlight {
          color: var(--pintu-primary);
        }
      }
    }

    .card-bottom-actions {
      padding-top: 10px;

      .switch-store-big-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        background: var(--vendor-surface-secondary);
        border: 1.5px solid var(--pintu-primary);
        color: var(--pintu-primary);
        font-size: 13.5px;
        font-weight: 750;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: var(--pintu-primary-surface);
          transform: translateY(-1px);
        }
      }
    }

    /* Theme Section */
    .theme-settings-card {
      .section-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;

        .title-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--pintu-primary-surface);
          color: var(--pintu-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .appearance-header-text {
          display: flex;
          flex-direction: column;
        }

        .appearance-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: var(--vendor-text-primary);
        }

        .appearance-sub {
          margin: 3px 0 0;
          font-size: 13px;
          color: var(--vendor-text-secondary);
        }
      }

      .theme-options-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }

      .theme-card-option {
        display: flex;
        flex-direction: column;
        background: var(--vendor-surface-secondary);
        border: 2px solid var(--vendor-border);
        border-radius: 14px;
        padding: 12px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--pintu-primary);
          transform: translateY(-2px);
        }

        &.selected {
          border-color: var(--pintu-primary);
          background: var(--pintu-primary-surface);
          box-shadow: 0 0 0 3px var(--pintu-primary-glow);

          .radio-indicator {
            border-color: var(--pintu-primary);
            background: var(--pintu-primary);
            box-shadow: inset 0 0 0 2.5px var(--vendor-surface);
          }
        }
      }

      .theme-preview {
        height: 64px;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 10px;
        border: 1px solid var(--vendor-border);
        position: relative;

        &.light-preview {
          background: #f8fafc;
          .preview-header {
            height: 18px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
          }
          .preview-body {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .preview-line {
            height: 6px;
            border-radius: 4px;
            &.line-1 { width: 70%; background: #cbd5e1; }
            &.line-2 { width: 45%; background: #e2e8f0; }
          }
        }

        &.dark-preview {
          background: #0b1320;
          .preview-header {
            height: 18px;
            background: #111a2c;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .preview-body {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .preview-line {
            height: 6px;
            border-radius: 4px;
            &.line-1 { width: 70%; background: #334155; }
            &.line-2 { width: 45%; background: #1e293b; }
          }
        }

        &.system-preview {
          display: flex;
          .preview-split-left {
            flex: 1;
            background: #f8fafc;
            border-right: 1px solid #cbd5e1;
          }
          .preview-split-right {
            flex: 1;
            background: #0b1320;
          }
        }
      }

      .option-footer {
        display: flex;
        align-items: center;
        gap: 10px;

        .radio-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid var(--vendor-text-muted);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .option-meta {
          display: flex;
          flex-direction: column;

          .option-title {
            font-size: 13.5px;
            font-weight: 750;
            color: var(--vendor-text-primary);
          }

          .option-desc {
            font-size: 11px;
            color: var(--vendor-text-secondary);
          }
        }
      }
    }

    .logout-card {
      padding: 16px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 13px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #ef4444;
        color: #ffffff;
      }
    }
  `],
  standalone: false,
})
export class SettingsPage implements OnInit, OnDestroy {
  user: VendorUser | null = null;
  activeStore: VendorStore | null = null;

  private subs: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private storeService: StoreService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
    this.cdr.markForCheck();
  }

  async openStoreSwitcher(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: StoreSwitcherModalComponent,
      cssClass: 'store-switcher-modal-custom',
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.selected && data.store) {
      this.activeStore = data.store;
      this.cdr.markForCheck();
    }
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Sign Out',
      message: 'Are you sure you want to sign out from Pintu Vendor?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
          },
        },
      ],
    });

    await alert.present();
  }
}
