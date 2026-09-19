import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { AnalyticsPageRoutingModule } from './analytics-routing.module';
import { AnalyticsPage } from './analytics.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnalyticsPageRoutingModule,
  ],
  declarations: [AnalyticsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AnalyticsPageModule {}
