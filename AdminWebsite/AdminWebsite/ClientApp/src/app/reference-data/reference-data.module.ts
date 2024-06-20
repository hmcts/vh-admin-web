import { NgModule } from '@angular/core';

import { ReferenceDataRoutingModule } from './reference-data-routing.module';
import { LanguagesComponent } from './languages/languages.component';
import { SharedModule } from '../shared/shared.module';
import { ManageReferenceDataComponent } from './manage-reference-data/manage-reference-data.component';

@NgModule({
    declarations: [LanguagesComponent, ManageReferenceDataComponent],
    imports: [SharedModule, ReferenceDataRoutingModule]
})
export class ReferenceDataModule {}
