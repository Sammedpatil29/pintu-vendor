import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular/lazy';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorStore, StoreSettlement } from '../../models/vendor.model';

@Component({
  selector: 'app-analytics',
  template: `
    <div class="analytics-page">
      <!-- Store Scope Card -->
      <div class="store-scope-card">
        <div class="scope-left">
          <div class="scope-icon">
            <ion-icon [name]="activeStore?.serviceIcon || 'wallet-outline'"></ion-icon>
          </div>
          <div class="scope-info">
            <div class="scope-breadcrumbs">
              <span>{{ activeStore?.city }}</span>
              <span class="sep">&rsaquo;</span>
              <span>{{ activeStore?.serviceLabel }}</span>
            </div>
            <h2>{{ activeStore?.name }} &bull; Financials</h2>
            <p>Direct bank settlements &amp; gross commission statements for {{ activeStore?.city }}</p>
          </div>
        </div>
        <button type="button" class="switch-store-action-btn" (click)="openStoreSwitcher()">
          <ion-icon name="swap-horizontal-outline"></ion-icon>
          <span>Switch Store</span>
        </button>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="financial-cards-grid">
        <div class="fin-card">
          <span class="fin-title">Total Gross Volume</span>
          <h3 class="fin-value">₹{{ totalGross | number:'1.0-0' }}</h3>
          <span class="fin-sub">Processed on Pintu Platform</span>
        </div>
        <div class="fin-card highlight">
          <span class="fin-title">Net Bank Payouts</span>
          <h3 class="fin-value">₹{{ totalNet | number:'1.0-0' }}</h3>
          <span class="fin-sub text-emerald">100% On-Time Disbursed</span>
        </div>
        <div class="fin-card">
          <span class="fin-title">Platform &amp; PG Fee</span>
          <h3 class="fin-value">₹{{ totalFees | number:'1.0-0' }}</h3>
          <span class="fin-sub">Average 3.0% platform fee</span>
        </div>
      </div>

      <!-- Settlements Table Card -->
      <div class="settlements-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Settlement &amp; Disbursal History</h3>
            <p class="card-sub">Automated T+1 daily batch settlements transferred to your registered bank account</p>
          </div>
        </div>

        <div class="table-container" *ngIf="settlements.length > 0; else noSettlements">
          <table class="settlements-table">
            <thead>
              <tr>
                <th>Batch Reference</th>
                <th>Disbursal Date</th>
                <th>Gross Sales</th>
                <th>Platform Fee</th>
                <th>Net Bank Payout</th>
                <th>Destination Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let stl of settlements">
                <td>
                  <strong class="ref-code">{{ stl.id | uppercase }}</strong>
                </td>
                <td>
                  <span class="date-text">{{ stl.settlementDate }}</span>
                </td>
                <td>
                  <span class="val-text">₹{{ stl.grossAmount | number:'1.0-0' }}</span>
                </td>
                <td>
                  <span class="fee-text">-₹{{ stl.platformFee | number:'1.0-0' }}</span>
                </td>
                <td>
                  <strong class="net-payout">₹{{ stl.netPayout | number:'1.0-0' }}</strong>
                </td>
                <td>
                  <span class="bank-text">{{ stl.bankAccount }}</span>
                </td>
                <td>
                  <span class="settled-badge">
                    <ion-icon name="checkmark-circle"></ion-icon>
                    <span>Settled</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noSettlements>
          <div class="empty-state-box">
            <ion-icon name="wallet-outline"></ion-icon>
            <p>No past settlement records for this store yet.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Store Scope Card */
    .store-scope-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      background: var(--vendor-surface);
      border: 1px solid var(--vendor-border);
      border-radius: 20px;
      box-shadow: var(--vendor-card-shadow);

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
      }

      .scope-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .scope-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #a000e2 0%, #7900b2 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .scope-info {
        display: flex;
        flex-direction: column;

        .scope-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 750;
          color: var(--pintu-primary);
          text-transform: uppercase;
          letter-spacing: 0.4px;

          .sep {
            color: var(--vendor-text-muted);
          }
        }

        h2 {
          margin: 2px 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--vendor-text-primary);
        }

        p {
          margin: 0;
          font-size: 12px;
          color: var(--vendor-text-secondary);
        }
      }

      .switch-store-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 18px;
        border-radius: 12px;
        background: var(--pintu-primary-surface);
        border: 1.5px solid var(--pintu-primary);
        color: var(--pintu-primary);
        font-size: 13px;
        font-weight: 750;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;

        &:hover {
          background: var(--pintu-primary);
          color: #ffffff;
          transform: translateY(-1px);
        }
      }
    }

    /* Financial Cards Grid */
    .financial-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;

      @media (max-width: 700px) {
        grid-template-columns: 1fr;
      }

      .fin-card {
        background: var(--vendor-surface);
        border: 1px solid var(--vendor-border);
        border-radius: 18px;
        padding: 20px;
        box-shadow: var(--vendor-card-shadow);
        display: flex;
        flex-direction: column;
        gap: 6px;

        &.highlight {
          border-color: var(--pintu-primary);
          background: var(--pintu-primary-surface);
        }

        .fin-title {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--vendor-text-secondary);
        }

        .fin-value {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: var(--vendor-text-primary);
        }

        .fin-sub {
          font-size: 11.5px;
          color: var(--vendor-text-muted);

          &.text-emerald {
            color: #10b981;
            font-weight: 750;
          }
        }
      }
    }

    /* Settlements Table Card */
    .settlements-card {
      background: var(--vendor-surface);
      border: 1px solid var(--vendor-border);
      border-radius: 20px;
      padding: 22px;
      box-shadow: var(--vendor-card-shadow);

      .card-header-row {
        margin-bottom: 20px;

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--vendor-text-primary);
        }

        .card-sub {
          margin: 4px 0 0;
          font-size: 12.5px;
          color: var(--vendor-text-secondary);
        }
      }

      .table-container {
        overflow-x: auto;
      }

      .settlements-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;

        th {
          padding: 12px 14px;
          font-size: 11.5px;
          font-weight: 750;
          color: var(--vendor-text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--vendor-border);
          white-space: nowrap;
        }

        td {
          padding: 14px;
          font-size: 13px;
          color: var(--vendor-text-secondary);
          border-bottom: 1px solid var(--vendor-border-subtle);
          white-space: nowrap;

          .ref-code {
            color: var(--pintu-primary);
            font-weight: 800;
          }

          .net-payout {
            font-size: 14px;
            font-weight: 850;
            color: var(--vendor-text-primary);
          }

          .fee-text {
            color: #ef4444;
            font-size: 12px;
          }

          .bank-text {
            font-size: 12px;
            color: var(--vendor-text-muted);
          }

          .settled-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 10px;
            border-radius: 999px;
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            font-size: 11px;
            font-weight: 800;
          }
        }
      }

      .empty-state-box {
        text-align: center;
        padding: 40px 20px;
        color: var(--vendor-text-muted);

        ion-icon {
          font-size: 36px;
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 13.5px;
        }
      }
    }
  `],
  standalone: false,
})
export class AnalyticsPage implements OnInit, OnDestroy {
  activeStore: VendorStore | null = null;
  settlements: StoreSettlement[] = [];

  private subs: Subscription = new Subscription();

  constructor(
    private storeService: StoreService,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.settlements = [...store.settlements];
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get totalGross(): number {
    return this.settlements.reduce((acc, s) => acc + s.grossAmount, 0);
  }

  get totalNet(): number {
    return this.settlements.reduce((acc, s) => acc + s.netPayout, 0);
  }

  get totalFees(): number {
    return this.settlements.reduce((acc, s) => acc + s.platformFee, 0);
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
      this.settlements = [...data.store.settlements];
      this.cdr.markForCheck();
    }
  }
}
