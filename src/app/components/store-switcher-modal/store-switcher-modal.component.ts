import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular/lazy';
import { StoreService } from '../../services/store.service';
import { VendorStore, StoreServiceType } from '../../models/vendor.model';

@Component({
  selector: 'app-store-switcher-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="store-switcher-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-text">
          <h3>Switch Active Store</h3>
          <p>Select City &rsaquo; Service Category &rsaquo; Store Outlet</p>
        </div>
        <button type="button" class="close-btn" (click)="dismiss()">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <!-- Active Store Banner -->
      <div class="active-store-strip" *ngIf="activeStore">
        <div class="strip-left">
          <div class="strip-icon">
            <ion-icon [name]="activeStore.serviceIcon"></ion-icon>
          </div>
          <div class="strip-info">
            <small>Currently Managing</small>
            <strong>{{ activeStore.name }}</strong>
            <span>{{ activeStore.city }} &bull; {{ activeStore.serviceLabel }}</span>
          </div>
        </div>
        <span class="active-tag">Active</span>
      </div>

      <!-- Search Input -->
      <div class="search-box">
        <ion-icon name="search-outline"></ion-icon>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Quick search store by name, area, city..."
        />
        <button type="button" *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
          <ion-icon name="close-circle"></ion-icon>
        </button>
      </div>

      <!-- SEARCH RESULTS VIEW (when user is typing) -->
      <div class="search-results-section" *ngIf="searchQuery.trim().length > 0">
        <div class="section-label">Matching Stores ({{ filteredSearchStores.length }})</div>
        <div class="store-cards-list" *ngIf="filteredSearchStores.length > 0; else noResults">
          <div
            *ngFor="let s of filteredSearchStores"
            class="store-card"
            [class.selected]="s.id === activeStore?.id"
            (click)="selectStore(s)"
          >
            <div class="store-card-icon">
              <ion-icon [name]="s.serviceIcon"></ion-icon>
            </div>
            <div class="store-card-body">
              <div class="card-title-row">
                <h4>{{ s.name }}</h4>
                <span class="status-pill" [class.online]="s.isOpen">
                  {{ s.isOpen ? 'Online' : 'Paused' }}
                </span>
              </div>
              <p class="store-location">
                <ion-icon name="location-outline"></ion-icon>
                <span>{{ s.address }}</span>
              </p>
              <div class="card-footer-tags">
                <span class="city-tag">{{ s.city }}</span>
                <span class="service-tag">{{ s.serviceLabel }}</span>
                <span class="rating-tag">&starf; {{ s.rating }}</span>
              </div>
            </div>
            <div class="store-card-action">
              <ion-icon
                [name]="s.id === activeStore?.id ? 'checkmark-circle' : 'chevron-forward-outline'"
                [class.checked]="s.id === activeStore?.id"
              ></ion-icon>
            </div>
          </div>
        </div>
        <ng-template #noResults>
          <div class="empty-state">
            <ion-icon name="search"></ion-icon>
            <p>No stores found matching "{{ searchQuery }}"</p>
          </div>
        </ng-template>
      </div>

      <!-- HIERARCHICAL BROWSER (City > Service Type > Store) -->
      <div class="hierarchy-browser" *ngIf="searchQuery.trim().length === 0">
        <!-- STEP 1: Select City -->
        <div class="step-container">
          <div class="step-heading">
            <span class="step-num">1</span>
            <span>Select City</span>
          </div>
          <div class="city-pills-row">
            <button
              type="button"
              *ngFor="let city of cities"
              class="city-pill"
              [class.active]="city === selectedCity"
              (click)="onSelectCity(city)"
            >
              <ion-icon name="navigate-outline"></ion-icon>
              <span>{{ city }}</span>
              <span class="city-badge">{{ getCityStoreCount(city) }}</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Select Service Type -->
        <div class="step-container">
          <div class="step-heading">
            <span class="step-num">2</span>
            <span>Select Service Category in {{ selectedCity }}</span>
          </div>
          <div class="services-grid">
            <button
              type="button"
              *ngFor="let svc of availableServices"
              class="service-card-btn"
              [class.active]="svc.type === selectedServiceType"
              (click)="onSelectService(svc.type)"
            >
              <div class="service-icon-box">
                <ion-icon [name]="svc.icon"></ion-icon>
              </div>
              <div class="service-label-box">
                <span class="service-name">{{ svc.label }}</span>
                <span class="service-count">{{ svc.count }} Outlet{{ svc.count > 1 ? 's' : '' }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- STEP 3: Select Store Outlet -->
        <div class="step-container">
          <div class="step-heading">
            <span class="step-num">3</span>
            <span>Choose Outlet ({{ matchingStores.length }})</span>
          </div>
          <div class="store-cards-list">
            <div
              *ngFor="let store of matchingStores"
              class="store-card"
              [class.selected]="store.id === activeStore?.id"
              (click)="selectStore(store)"
            >
              <div class="store-card-icon">
                <ion-icon [name]="store.serviceIcon"></ion-icon>
              </div>
              <div class="store-card-body">
                <div class="card-title-row">
                  <h4>{{ store.name }}</h4>
                  <span class="status-pill" [class.online]="store.isOpen">
                    {{ store.isOpen ? 'Online' : 'Paused' }}
                  </span>
                </div>
                <p class="store-location">
                  <ion-icon name="location-outline"></ion-icon>
                  <span>{{ store.address }}</span>
                </p>
                <div class="card-footer-tags">
                  <span class="license-tag">{{ store.licenseType }}: {{ store.licenseNumber }}</span>
                  <span class="rating-tag">&starf; {{ store.rating }}</span>
                </div>
              </div>
              <div class="store-card-action">
                <ion-icon
                  [name]="store.id === activeStore?.id ? 'checkmark-circle' : 'chevron-forward-outline'"
                  [class.checked]="store.id === activeStore?.id"
                ></ion-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .store-switcher-modal {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      background: var(--vendor-surface);
      color: var(--vendor-text-primary);
      border-radius: 24px;
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: var(--vendor-text-primary);
        letter-spacing: -0.3px;
      }

      p {
        margin: 4px 0 0;
        font-size: 12.5px;
        color: var(--vendor-text-secondary);
      }

      .close-btn {
        background: var(--vendor-pill-bg);
        border: 1px solid var(--vendor-border);
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vendor-text-muted);
        cursor: pointer;
        font-size: 20px;
        transition: all 0.2s;

        &:hover {
          background: var(--vendor-surface-hover);
          color: var(--vendor-text-primary);
        }
      }
    }

    /* Active Store Strip */
    .active-store-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--pintu-primary-surface);
      border: 1px solid rgba(160, 0, 226, 0.35);
      border-radius: 14px;
      margin-bottom: 18px;

      .strip-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .strip-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: linear-gradient(135deg, #a000e2 0%, #7900b2 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      .strip-info {
        display: flex;
        flex-direction: column;

        small {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--pintu-primary);
          font-weight: 800;
        }

        strong {
          font-size: 14.5px;
          color: var(--vendor-text-primary);
          font-weight: 800;
        }

        span {
          font-size: 11.5px;
          color: var(--vendor-text-secondary);
        }
      }

      .active-tag {
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--pintu-primary);
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }
    }

    /* Search Box */
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--vendor-surface-secondary);
      border: 1.5px solid var(--vendor-border);
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 20px;
      transition: all 0.2s ease;

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

      .clear-search {
        background: transparent;
        border: none;
        color: var(--vendor-text-muted);
        font-size: 16px;
        cursor: pointer;
        padding: 0;
      }
    }

    /* Hierarchy Browser Steps */
    .step-container {
      margin-bottom: 22px;
    }

    .step-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 800;
      color: var(--vendor-text-primary);
      margin-bottom: 12px;

      .step-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--pintu-primary-surface);
        color: var(--pintu-primary);
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
      }
    }

    /* City Pills */
    .city-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .city-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 14px;
        border-radius: 10px;
        background: var(--vendor-surface-secondary);
        border: 1.5px solid var(--vendor-border);
        color: var(--vendor-text-secondary);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;

        ion-icon {
          font-size: 15px;
          color: var(--vendor-text-muted);
        }

        .city-badge {
          background: var(--vendor-pill-bg);
          color: var(--vendor-text-muted);
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 11px;
        }

        &:hover {
          border-color: var(--pintu-primary);
          color: var(--vendor-text-primary);
        }

        &.active {
          background: var(--pintu-primary-surface);
          border-color: var(--pintu-primary);
          color: var(--pintu-primary);

          ion-icon {
            color: var(--pintu-primary);
          }

          .city-badge {
            background: var(--pintu-primary);
            color: #ffffff;
          }
        }
      }
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;

      .service-card-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        background: var(--vendor-surface-secondary);
        border: 1.5px solid var(--vendor-border);
        color: var(--vendor-text-secondary);
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;

        .service-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--vendor-pill-bg);
          color: var(--vendor-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .service-label-box {
          display: flex;
          flex-direction: column;

          .service-name {
            font-size: 12.5px;
            font-weight: 750;
            color: var(--vendor-text-primary);
          }

          .service-count {
            font-size: 11px;
            color: var(--vendor-text-muted);
          }
        }

        &:hover {
          border-color: var(--pintu-primary);
          transform: translateY(-1px);

          .service-icon-box {
            color: var(--pintu-primary);
            background: var(--pintu-primary-surface);
          }
        }

        &.active {
          background: var(--pintu-primary-surface);
          border-color: var(--pintu-primary);

          .service-icon-box {
            background: var(--pintu-primary);
            color: #ffffff;
          }

          .service-name {
            color: var(--pintu-primary);
          }
        }
      }
    }

    /* Store Cards List */
    .store-cards-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .store-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px;
        border-radius: 14px;
        background: var(--vendor-surface-secondary);
        border: 1.5px solid var(--vendor-border);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--pintu-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(160, 0, 226, 0.12);
        }

        &.selected {
          border-color: var(--pintu-primary);
          background: var(--pintu-primary-surface);
          box-shadow: 0 0 0 3px var(--pintu-primary-glow);
        }

        .store-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #a000e2 0%, #7900b2 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .store-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;

          .card-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;

            h4 {
              margin: 0;
              font-size: 14px;
              font-weight: 800;
              color: var(--vendor-text-primary);
            }

            .status-pill {
              font-size: 10px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 999px;
              background: rgba(245, 158, 11, 0.15);
              color: #f59e0b;

              &.online {
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
              }
            }
          }

          .store-location {
            margin: 0;
            font-size: 12px;
            color: var(--vendor-text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;

            ion-icon {
              font-size: 13px;
              color: var(--vendor-text-muted);
            }
          }

          .card-footer-tags {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;

            span {
              font-size: 10.5px;
              padding: 2px 6px;
              border-radius: 6px;
              background: var(--vendor-pill-bg);
              color: var(--vendor-text-muted);
              font-weight: 600;
            }

            .rating-tag {
              color: #f59e0b;
              font-weight: 800;
            }

            .city-tag, .service-tag {
              color: var(--pintu-primary);
              background: var(--pintu-primary-surface);
            }
          }
        }

        .store-card-action {
          ion-icon {
            font-size: 24px;
            color: var(--vendor-text-muted);

            &.checked {
              color: var(--pintu-primary);
            }
          }
        }
      }
    }

    .section-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--vendor-text-secondary);
      margin-bottom: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vendor-text-muted);

      ion-icon {
        font-size: 40px;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
        font-size: 13.5px;
      }
    }
  `],
})
export class StoreSwitcherModalComponent implements OnInit, OnDestroy {
  activeStore: VendorStore | null = null;
  cities: string[] = [];
  selectedCity: string = 'Hubballi';
  selectedServiceType: StoreServiceType = 'pharmacy';
  availableServices: { type: StoreServiceType; label: string; icon: string; count: number }[] = [];
  matchingStores: VendorStore[] = [];

  searchQuery: string = '';
  allStores: VendorStore[] = [];

  private subs: Subscription = new Subscription();

  constructor(
    private storeService: StoreService,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activeStore = this.storeService.getActiveStore();
    this.cities = this.storeService.getCities();
    this.allStores = this.storeService.getAllStores();

    if (this.activeStore) {
      this.selectedCity = this.activeStore.city;
      this.selectedServiceType = this.activeStore.serviceType;
    } else if (this.cities.length > 0) {
      this.selectedCity = this.cities[0];
    }

    this.updateServiceTypes();
    this.updateMatchingStores();

    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.allStores = this.storeService.getAllStores();
        this.updateServiceTypes();
        this.updateMatchingStores();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getCityStoreCount(city: string): number {
    return this.allStores.filter((s) => s.city.toLowerCase() === city.toLowerCase()).length;
  }

  onSelectCity(city: string): void {
    this.allStores = this.storeService.getAllStores();
    this.selectedCity = city;
    this.updateServiceTypes();
    // Default to first available service in this city if current service is not available
    if (!this.availableServices.some((s) => s.type === this.selectedServiceType)) {
      if (this.availableServices.length > 0) {
        this.selectedServiceType = this.availableServices[0].type;
      }
    }
    this.updateMatchingStores();
    this.cdr.markForCheck();
  }

  onSelectService(type: StoreServiceType): void {
    this.selectedServiceType = type;
    this.updateMatchingStores();
    this.cdr.markForCheck();
  }

  updateServiceTypes(): void {
    this.availableServices = this.storeService.getServiceTypes(this.selectedCity);
  }

  updateMatchingStores(): void {
    this.matchingStores = this.storeService.getStoresByCityAndService(
      this.selectedCity,
      this.selectedServiceType
    );
  }

  get filteredSearchStores(): VendorStore[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return [];
    return this.allStores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.serviceLabel.toLowerCase().includes(q)
    );
  }

  selectStore(store: VendorStore): void {
    this.storeService.setActiveStore(store.id);
    this.modalCtrl.dismiss({ selected: true, store });
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}

