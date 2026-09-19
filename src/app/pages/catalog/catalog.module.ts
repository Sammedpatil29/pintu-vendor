import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { CatalogPageRoutingModule } from './catalog-routing.module';
import { CatalogPage } from './catalog.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CatalogPageRoutingModule,
  ],
  declarations: [CatalogPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CatalogPageModule {}
