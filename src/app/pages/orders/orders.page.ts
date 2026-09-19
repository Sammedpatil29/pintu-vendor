import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastController, ModalController } from '@ionic/angular/lazy';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorStore, StoreOrderItem } from '../../models/vendor.model';

@Component({
  selector: 'app-orders',
  template: `
    <div class="orders-page">
      <!-- Store Header Card -->
      <div class="store-scope-card">
        <div class="scope-left">
          <div class="scope-icon">
            <ion-icon [name]="activeStore?.serviceIcon || 'receipt-outline'"></ion-icon>
          </div>
          <div class="scope-info">
            <div class="scope-breadcrumbs">
              <span>{{ activeStore?.city }}</span>
              <span class="sep">&rsaquo;</span>
              <span>{{ activeStore?.serviceLabel }}</span>
            </div>
            <h2>{{ activeStore?.name }}</h2>
            <p>{{ activeStore?.address }}</p>
          </div>
        </div>
        <button type="button" class="switch-store-action-btn" (click)="openStoreSwitcher()">
          <ion-icon name="swap-horizontal-outline"></ion-icon>
          <span>Switch Store</span>
        </button>
      </div>

      <!-- Filter Tabs Bar -->
      <div class="orders-filter-bar">
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedTab === 'all'"
          (click)="selectedTab = 'all'"
        >
          All ({{ allOrders.length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedTab === 'new'"
          (click)="selectedTab = 'new'"
        >
          New ({{ getCount('new') }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedTab === 'preparing'"
          (click)="selectedTab = 'preparing'"
        >
          In Progress ({{ getCount('preparing') }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedTab === 'delivered'"
          (click)="selectedTab = 'delivered'"
        >
          Completed ({{ getCount('delivered') }})
        </button>
      </div>

      <!-- Orders List -->
      <div class="orders-cards-container" *ngIf="filteredOrders.length > 0; else noOrdersFound">
        <div *ngFor="let ord of filteredOrders" class="order-management-card">
          <!-- Card Top Bar -->
          <div class="card-header-bar">
            <div class="header-left-col">
              <span class="order-code">{{ ord.orderNumber }}</span>
              <span class="time-ago">{{ ord.timeAgo }}</span>
            </div>
            <span class="order-status-badge" [ngClass]="getStatusBadgeClass(ord.status)">
              {{ getStatusLabel(ord.status) }}
            </span>
          </div>

          <!-- Customer Info -->
          <div class="customer-row">
            <div class="customer-profile">
              <div class="avatar-letter">{{ ord.customerName.charAt(0) }}</div>
              <div class="customer-text">
                <strong>{{ ord.customerName }}</strong>
                <span>+91 {{ ord.customerPhone }}</span>
              </div>
            </div>
            <div class="amount-pill">
              <span class="amount-label">{{ ord.paymentMethod || 'Prepaid' }}</span>
              <span class="amount-num">₹{{ ord.totalAmount | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- Items Summary -->
          <div class="order-items-summary">
            <div class="summary-label">
              <ion-icon [name]="activeStore?.serviceIcon || 'bag-handle-outline'"></ion-icon>
              <span>Items / Booking Details</span>
            </div>
            <p class="summary-text">{{ ord.itemsSummary }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="order-actions-bar">
            <ng-container *ngIf="ord.status === 'new'">
              <button type="button" class="btn-primary" (click)="updateStatus(ord, 'preparing')">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <span>Accept &amp; Process</span>
              </button>
              <button type="button" class="btn-outline-danger" (click)="cancelOrder(ord)">
                <span>Reject</span>
              </button>
            </ng-container>

            <ng-container *ngIf="ord.status === 'preparing'">
              <button type="button" class="btn-primary" (click)="updateStatus(ord, 'out_for_delivery')">
                <ion-icon name="bicycle-outline"></ion-icon>
                <span>Mark Ready / Hand Over</span>
              </button>
            </ng-container>

            <ng-container *ngIf="ord.status === 'out_for_delivery'">
              <button type="button" class="btn-primary" (click)="updateStatus(ord, 'delivered')">
                <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                <span>Mark as Fulfilled</span>
              </button>
            </ng-container>

            <ng-container *ngIf="ord.status === 'delivered'">
              <div class="fulfilled-tag">
                <ion-icon name="checkmark-circle"></ion-icon>
                <span>Fulfilled Successfully</span>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <ng-template #noOrdersFound>
        <div class="empty-state-card">
          <div class="empty-icon-wrap">
            <ion-icon name="receipt-outline"></ion-icon>
          </div>
          <h3>No Orders Found</h3>
          <p>There are no orders matching this filter for <strong>{{ activeStore?.name }}</strong>.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .orders-page {
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

    /* Filter Bar */
    .orders-filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .filter-pill {
        padding: 8px 16px;
        border-radius: 10px;
        background: var(--vendor-surface-secondary);
        border: 1.5px solid var(--vendor-border);
        color: var(--vendor-text-secondary);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: var(--pintu-primary);
          color: var(--vendor-text-primary);
        }

        &.active {
          background: var(--pintu-primary-surface);
          border-color: var(--pintu-primary);
          color: var(--pintu-primary);
        }
      }
    }

    /* Cards */
    .orders-cards-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-management-card {
      background: var(--vendor-surface);
      border: 1px solid var(--vendor-border);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: var(--vendor-card-shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--pintu-primary);
      }

      .card-header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left-col {
          display: flex;
          align-items: center;
          gap: 10px;

          .order-code {
            font-size: 15px;
            font-weight: 800;
            color: var(--pintu-primary);
            letter-spacing: 0.3px;
          }

          .time-ago {
            font-size: 12px;
            color: var(--vendor-text-muted);
          }
        }
      }

      .customer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vendor-border-subtle);

        .customer-profile {
          display: flex;
          align-items: center;
          gap: 12px;

          .avatar-letter {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--vendor-pill-bg);
            border: 1px solid var(--vendor-border);
            color: var(--vendor-text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
          }

          .customer-text {
            display: flex;
            flex-direction: column;

            strong {
              font-size: 14px;
              color: var(--vendor-text-primary);
            }

            span {
              font-size: 11.5px;
              color: var(--vendor-text-muted);
            }
          }
        }

        .amount-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .amount-label {
            font-size: 10.5px;
            color: var(--vendor-text-muted);
            text-transform: uppercase;
            font-weight: 700;
          }

          .amount-num {
            font-size: 16px;
            font-weight: 800;
            color: var(--vendor-text-primary);
          }
        }
      }

      .order-items-summary {
        background: var(--vendor-surface-secondary);
        border: 1px solid var(--vendor-border-subtle);
        border-radius: 12px;
        padding: 12px 14px;

        .summary-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 750;
          color: var(--pintu-primary);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .summary-text {
          margin: 0;
          font-size: 13px;
          color: var(--vendor-text-primary);
          line-height: 1.4;
        }
      }

      .order-actions-bar {
        display: flex;
        align-items: center;
        gap: 10px;

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, #a000e2 0%, #7900b2 100%);
          color: #ffffff;
          border: none;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: translateY(-1px);
            background: linear-gradient(135deg, #b526f2 0%, #8600be 100%);
          }
        }

        .btn-outline-danger {
          padding: 9px 16px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;

          &:hover {
            background: rgba(239, 68, 68, 0.1);
          }
        }

        .fulfilled-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-size: 13px;
          font-weight: 750;

          ion-icon {
            font-size: 18px;
          }
        }
      }
    }

    /* Status Badges */
    .order-status-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;

      &.badge-new {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      &.badge-preparing {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      &.badge-transit {
        background: var(--pintu-primary-surface);
        color: var(--pintu-primary);
        border: 1px solid rgba(160, 0, 226, 0.3);
      }

      &.badge-delivered {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
    }

    /* Empty State */
    .empty-state-card {
      padding: 60px 20px;
      text-align: center;
      background: var(--vendor-surface);
      border: 1px solid var(--vendor-border);
      border-radius: 20px;

      .empty-icon-wrap {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--vendor-pill-bg);
        color: var(--vendor-text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        margin: 0 auto 14px;
      }

      h3 {
        margin: 0 0 6px;
        font-size: 17px;
        font-weight: 800;
        color: var(--vendor-text-primary);
      }

      p {
        margin: 0;
        font-size: 13.5px;
        color: var(--vendor-text-secondary);
      }
    }
  `],
  standalone: false,
})
export class OrdersPage implements OnInit, OnDestroy {
  activeStore: VendorStore | null = null;
  allOrders: StoreOrderItem[] = [];
  selectedTab: 'all' | 'new' | 'preparing' | 'delivered' = 'all';

  private subs: Subscription = new Subscription();

  constructor(
    private storeService: StoreService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.allOrders = [...store.orders];
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get filteredOrders(): StoreOrderItem[] {
    if (this.selectedTab === 'all') return this.allOrders;
    if (this.selectedTab === 'new') return this.allOrders.filter((o) => o.status === 'new');
    if (this.selectedTab === 'preparing') return this.allOrders.filter((o) => o.status === 'preparing' || o.status === 'ready' || o.status === 'out_for_delivery');
    if (this.selectedTab === 'delivered') return this.allOrders.filter((o) => o.status === 'delivered');
    return this.allOrders;
  }

  getCount(tab: 'new' | 'preparing' | 'delivered'): number {
    if (tab === 'new') return this.allOrders.filter((o) => o.status === 'new').length;
    if (tab === 'preparing') return this.allOrders.filter((o) => o.status === 'preparing' || o.status === 'ready' || o.status === 'out_for_delivery').length;
    if (tab === 'delivered') return this.allOrders.filter((o) => o.status === 'delivered').length;
    return 0;
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
      this.allOrders = [...data.store.orders];
      this.cdr.markForCheck();
    }
  }

  async updateStatus(order: StoreOrderItem, nextStatus: 'preparing' | 'out_for_delivery' | 'delivered'): Promise<void> {
    order.status = nextStatus;
    this.cdr.markForCheck();
    const toast = await this.toastCtrl.create({
      message: `Order ${order.orderNumber} updated to ${this.getStatusLabel(nextStatus)}`,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }

  async cancelOrder(order: StoreOrderItem): Promise<void> {
    this.allOrders = this.allOrders.filter((o) => o.id !== order.id);
    this.cdr.markForCheck();
    const toast = await this.toastCtrl.create({
      message: `Order ${order.orderNumber} rejected`,
      duration: 2000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'new': return 'badge-new';
      case 'preparing': return 'badge-preparing';
      case 'ready':
      case 'out_for_delivery': return 'badge-transit';
      case 'delivered': return 'badge-delivered';
      default: return 'badge-new';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'new': return 'New Request';
      case 'preparing': return 'In Preparation';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Completed';
      default: return status;
    }
  }
}
