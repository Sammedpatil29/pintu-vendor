import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastController, ModalController, AlertController } from '@ionic/angular/lazy';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorStore, StoreCatalogItem } from '../../models/vendor.model';

@Component({
  selector: 'app-catalog',
  template: `
    <div class="catalog-page">
      <!-- Store Scope Card -->
      <div class="store-scope-card">
        <div class="scope-left">
          <div class="scope-icon">
            <ion-icon [name]="activeStore?.serviceIcon || 'cube-outline'"></ion-icon>
          </div>
          <div class="scope-info">
            <div class="scope-breadcrumbs">
              <span>{{ activeStore?.city }}</span>
              <span class="sep">&rsaquo;</span>
              <span>{{ activeStore?.serviceLabel }}</span>
            </div>
            <h2>{{ activeStore?.name }} &bull; Catalog</h2>
            <p>{{ catalogItems.length }} active offerings listed in {{ activeStore?.city }}</p>
          </div>
        </div>
        <div class="scope-actions">
          <button type="button" class="btn-add-item" (click)="promptAddItem()">
            <ion-icon name="add-circle-outline"></ion-icon>
            <span>Add Item</span>
          </button>
          <button type="button" class="switch-store-action-btn" (click)="openStoreSwitcher()">
            <ion-icon name="swap-horizontal-outline"></ion-icon>
            <span>Switch Store</span>
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="catalog-controls-row">
        <div class="search-input-box">
          <ion-icon name="search-outline"></ion-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search offerings in {{ activeStore?.name }}..."
          />
          <button type="button" *ngIf="searchQuery" class="clear-btn" (click)="searchQuery = ''">
            <ion-icon name="close-circle"></ion-icon>
          </button>
        </div>
        <div class="catalog-stats-pill">
          <span>In-Stock: <strong>{{ inStockCount }}</strong></span>
          <span class="dot">&bull;</span>
          <span>Out of Stock: <strong class="out-count">{{ outOfStockCount }}</strong></span>
        </div>
      </div>

      <!-- Catalog Items Grid -->
      <div class="catalog-grid" *ngIf="filteredItems.length > 0; else noItemsFound">
        <div *ngFor="let item of filteredItems" class="catalog-card" [class.out-of-stock]="!item.inStock">
          <div class="card-header-line">
            <span class="category-tag">{{ item.category }}</span>
            <button
              type="button"
              class="stock-toggle-pill"
              [class.active]="item.inStock"
              (click)="toggleStock(item)"
              [title]="item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'"
            >
              <span class="stock-dot"></span>
              <span>{{ item.inStock ? 'In Stock' : 'Out of Stock' }}</span>
            </button>
          </div>

          <div class="card-mid-info">
            <h4 class="item-title">{{ item.name }}</h4>
            <span class="item-unit">{{ item.unit }}</span>
          </div>

          <div class="card-pricing-row">
            <div class="price-box">
              <span class="price-val">₹{{ item.price | number:'1.0-0' }}</span>
              <span class="original-price" *ngIf="item.originalPrice">₹{{ item.originalPrice | number:'1.0-0' }}</span>
            </div>
            <button type="button" class="quick-edit-btn" (click)="promptEditPrice(item)" title="Update Price">
              <ion-icon name="pencil-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <ng-template #noItemsFound>
        <div class="empty-state-card">
          <div class="empty-icon-wrap">
            <ion-icon name="cube-outline"></ion-icon>
          </div>
          <h3>No Items Found</h3>
          <p>No products or service items matched your search query in <strong>{{ activeStore?.name }}</strong>.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .catalog-page {
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

      @media (max-width: 680px) {
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

      .scope-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;

        .btn-add-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 12px;
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

        .switch-store-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
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
    }

    /* Controls */
    .catalog-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;

      .search-input-box {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 240px;
        padding: 10px 14px;
        background: var(--vendor-surface);
        border: 1.5px solid var(--vendor-border);
        border-radius: 12px;
        transition: all 0.2s;

        &:focus-within {
          border-color: var(--pintu-primary);
          box-shadow: 0 0 0 3px var(--pintu-primary-glow);
        }

        ion-icon {
          font-size: 18px;
          color: var(--vendor-text-muted);
        }

        input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--vendor-text-primary);
          font-size: 13.5px;
          outline: none;

          &::placeholder {
            color: var(--vendor-text-muted);
          }
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: var(--vendor-text-muted);
          font-size: 16px;
          cursor: pointer;
          padding: 0;
        }
      }

      .catalog-stats-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--vendor-surface-secondary);
        border: 1px solid var(--vendor-border);
        border-radius: 12px;
        font-size: 12.5px;
        color: var(--vendor-text-secondary);

        strong {
          color: #10b981;
          font-weight: 800;

          &.out-count {
            color: #f59e0b;
          }
        }

        .dot {
          color: var(--vendor-text-muted);
        }
      }
    }

    /* Grid */
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .catalog-card {
      background: var(--vendor-surface);
      border: 1.5px solid var(--vendor-border);
      border-radius: 18px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      box-shadow: var(--vendor-card-shadow);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--pintu-primary);
        transform: translateY(-2px);
      }

      &.out-of-stock {
        opacity: 0.75;
        border-color: rgba(245, 158, 11, 0.4);
      }

      .card-header-line {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .category-tag {
          font-size: 10.5px;
          font-weight: 750;
          color: var(--pintu-primary);
          background: var(--pintu-primary-surface);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .stock-toggle-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;

          .stock-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #f59e0b;
          }

          &.active {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;

            .stock-dot {
              background: #10b981;
            }
          }
        }
      }

      .card-mid-info {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .item-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: var(--vendor-text-primary);
          line-height: 1.3;
        }

        .item-unit {
          font-size: 12px;
          color: var(--vendor-text-secondary);
        }
      }

      .card-pricing-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 10px;
        border-top: 1px solid var(--vendor-border-subtle);

        .price-box {
          display: flex;
          align-items: baseline;
          gap: 6px;

          .price-val {
            font-size: 18px;
            font-weight: 900;
            color: var(--vendor-text-primary);
          }

          .original-price {
            font-size: 12px;
            color: var(--vendor-text-muted);
            text-decoration: line-through;
          }
        }

        .quick-edit-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--vendor-surface-secondary);
          border: 1px solid var(--vendor-border);
          color: var(--vendor-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s;

          &:hover {
            border-color: var(--pintu-primary);
            color: var(--pintu-primary);
            background: var(--pintu-primary-surface);
          }
        }
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
export class CatalogPage implements OnInit, OnDestroy {
  activeStore: VendorStore | null = null;
  catalogItems: StoreCatalogItem[] = [];
  searchQuery: string = '';

  private subs: Subscription = new Subscription();

  constructor(
    private storeService: StoreService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.catalogItems = [...store.catalogItems];
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get filteredItems(): StoreCatalogItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.catalogItems;
    return this.catalogItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.unit.toLowerCase().includes(q)
    );
  }

  get inStockCount(): number {
    return this.catalogItems.filter((i) => i.inStock).length;
  }

  get outOfStockCount(): number {
    return this.catalogItems.filter((i) => !i.inStock).length;
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
      this.catalogItems = [...data.store.catalogItems];
      this.cdr.markForCheck();
    }
  }

  async toggleStock(item: StoreCatalogItem): Promise<void> {
    item.inStock = !item.inStock;
    this.cdr.markForCheck();
    const toast = await this.toastCtrl.create({
      message: `${item.name} is now ${item.inStock ? 'IN STOCK' : 'OUT OF STOCK'}`,
      duration: 2000,
      position: 'top',
      color: item.inStock ? 'success' : 'warning',
    });
    await toast.present();
  }

  async promptEditPrice(item: StoreCatalogItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: `Update Price: ${item.name}`,
      inputs: [
        {
          name: 'price',
          type: 'number',
          placeholder: 'Selling Price (₹)',
          value: item.price,
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save Price',
          handler: (data) => {
            const newPrice = Number(data.price);
            if (newPrice > 0) {
              item.price = newPrice;
              this.cdr.markForCheck();
              this.toastCtrl.create({
                message: `Price for ${item.name} updated to ₹${newPrice}`,
                duration: 2000,
                position: 'top',
                color: 'success',
              }).then((t) => t.present());
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async promptAddItem(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: `Add Offering to ${this.activeStore?.name}`,
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Item / Package Name' },
        { name: 'category', type: 'text', placeholder: 'Category (e.g. Antibiotics, Lab Checkup, Suite)' },
        { name: 'price', type: 'number', placeholder: 'Price (₹)' },
        { name: 'unit', type: 'text', placeholder: 'Unit (e.g. Strip, Pack, Month)' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add to Store',
          handler: (data) => {
            if (data.name && data.price) {
              const newItem: StoreCatalogItem = {
                id: `item-${Date.now()}`,
                name: data.name,
                category: data.category || 'General',
                price: Number(data.price),
                inStock: true,
                unit: data.unit || 'Unit',
              };
              this.catalogItems.unshift(newItem);
              this.toastCtrl.create({
                message: `${data.name} added to catalog!`,
                duration: 2500,
                position: 'top',
                color: 'success',
              }).then((t) => t.present());
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
