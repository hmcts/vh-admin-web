import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { initAll } from 'govuk-frontend';

if (environment.production) {
    enableProdMode();
}

initAll();

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.log(err));
