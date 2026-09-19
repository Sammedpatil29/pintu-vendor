import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { LayoutPageRoutingModule } from './layout-routing.module';
import { LayoutPage } from './layout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LayoutPageRoutingModule,
  ],
  declarations: [LayoutPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutPageModule {}
