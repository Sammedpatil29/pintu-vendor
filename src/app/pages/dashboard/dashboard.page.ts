import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModalController } from '@ionic/angular/lazy';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorUser, VendorStore, StoreOrderItem, StoreKPIs } from '../../models/vendor.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  vendor: VendorUser | null = null;
  activeStore: VendorStore | null = null;
  isStoreOpen: boolean = true;

  metrics: StoreKPIs = {
    todaySales: 18450,
    salesGrowth: '+14.2%',
    activeOrders: 4,
    completedToday: 38,
    totalProducts: 240,
    lowStockCount: 6,
  };

  recentOrders: StoreOrderItem[] = [];

  private subs: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private modalCtrl: ModalController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.vendor = this.authService.getCurrentUser();

    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.isStoreOpen = store.isOpen;
        this.metrics = store.metrics;
        this.recentOrders = store.orders;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
      this.isStoreOpen = data.store.isOpen;
      this.metrics = data.store.metrics;
      this.recentOrders = data.store.orders;
      this.cdr.markForCheck();
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'new':
        return 'badge-new';
      case 'preparing':
        return 'badge-preparing';
      case 'ready':
      case 'out_for_delivery':
        return 'badge-transit';
      case 'delivered':
        return 'badge-delivered';
      default:
        return 'badge-new';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'new':
        return 'New Order';
      case 'preparing':
        return 'In Progress';
      case 'ready':
        return 'Ready';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Completed';
      default:
        return status;
    }
  }

  navigateToOrders(): void {
    this.router.navigate(['/layout/orders']);
  }

  navigateToCatalog(): void {
    this.router.navigate(['/layout/catalog']);
  }
}
