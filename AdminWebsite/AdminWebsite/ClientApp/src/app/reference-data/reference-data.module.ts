import { NgModule } from '@angular/core';

import { ReferenceDataRoutingModule } from './reference-data-routing.module';
import { LanguagesComponent } from './languages/languages.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [LanguagesComponent],
    imports: [SharedModule, ReferenceDataRoutingModule]
})
export class ReferenceDataModule {}
