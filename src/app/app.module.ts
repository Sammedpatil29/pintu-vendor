import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy, ModalController, AlertController, ToastController } from '@ionic/angular/lazy';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ModalController,
    AlertController,
    ToastController,
    provideHttpClient(withInterceptorsFromDi()),
    provideZonelessChangeDetection(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
