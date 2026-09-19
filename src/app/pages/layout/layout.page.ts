import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ToastController, AlertController, ModalController } from '@ionic/angular/lazy';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { StoreService } from '../../services/store.service';
import { StoreSwitcherModalComponent } from '../../components/store-switcher-modal/store-switcher-modal.component';
import { VendorUser, VendorStore } from '../../models/vendor.model';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
  badgeColor?: string;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.scss'],
  standalone: false,
})
export class LayoutPage implements OnInit, OnDestroy {
  isSidebarCollapsed: boolean = false;
  isMobileDrawerOpen: boolean = false;
  isProfileMenuOpen: boolean = false;

  isStoreOpen: boolean = true;
  currentUser: VendorUser | null = null;
  activeStore: VendorStore | null = null;
  currentUrl: string = '/layout/dashboard';

  private subs: Subscription = new Subscription();

  navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/layout/dashboard',
      icon: 'grid-outline',
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/layout/orders',
      icon: 'receipt-outline',
      badge: 3,
      badgeColor: 'emerald',
    },
    {
      id: 'catalog',
      label: 'Catalog & Items',
      path: '/layout/catalog',
      icon: 'cube-outline',
    },
    {
      id: 'analytics',
      label: 'Settlements',
      path: '/layout/analytics',
      icon: 'wallet-outline',
    },
    {
      id: 'settings',
      label: 'Store Settings',
      path: '/layout/settings',
      icon: 'settings-outline',
    },
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    public storeService: StoreService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnInit(): void {
    this.currentUrl = this.router.url;

    this.subs.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.currentUrl = event.urlAfterRedirects;
          this.isMobileDrawerOpen = false;
          this.isProfileMenuOpen = false;
          this.cdr.markForCheck();
        })
    );

    this.subs.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.storeService.activeStore$.subscribe((store) => {
        this.activeStore = store;
        this.isStoreOpen = store.isOpen;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileDrawer(): void {
    this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
  }

  closeMobileDrawer(): void {
    this.isMobileDrawerOpen = false;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  async openStoreSwitcherModal(): Promise<void> {
    this.closeProfileMenu();
    this.closeMobileDrawer();

    const modal = await this.modalCtrl.create({
      component: StoreSwitcherModalComponent,
      cssClass: 'store-switcher-modal-custom',
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.selected && data.store) {
      this.activeStore = data.store;
      this.isStoreOpen = data.store.isOpen;
      this.cdr.markForCheck();

      const toast = await this.toastCtrl.create({
        message: `Active store switched to ${data.store.name} (${data.store.city})`,
        duration: 2500,
        position: 'top',
        color: 'success',
      });
      await toast.present();
    }
  }

  async onStoreStatusChange(): Promise<void> {
    const nextStatus = this.storeService.toggleActiveStoreStatus();
    this.isStoreOpen = nextStatus;
    this.cdr.markForCheck();

    const toast = await this.toastCtrl.create({
      message: nextStatus
        ? `${this.activeStore?.name || 'Store'} is now ONLINE. Receiving incoming orders.`
        : `${this.activeStore?.name || 'Store'} is now PAUSED. Incoming orders halted.`,
      duration: 2500,
      position: 'top',
      color: nextStatus ? 'success' : 'warning',
    });
    await toast.present();
  }

  isActive(path: string): boolean {
    return this.currentUrl.startsWith(path);
  }

  getPageTitle(): string {
    const active = this.navItems.find((item) => this.isActive(item.path));
    return active ? active.label : 'Vendor Hub';
  }

  async confirmLogout(): Promise<void> {
    this.closeProfileMenu();
    this.closeMobileDrawer();

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
