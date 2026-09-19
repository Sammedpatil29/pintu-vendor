import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { OrdersPageRoutingModule } from './orders-routing.module';
import { OrdersPage } from './orders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersPageRoutingModule,
  ],
  declarations: [OrdersPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OrdersPageModule {}
