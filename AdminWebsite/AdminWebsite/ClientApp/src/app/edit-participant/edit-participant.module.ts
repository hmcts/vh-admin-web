import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { EditParticipantSearchComponent } from './edit-participant-search/edit-participant-search.component';
import { EditParticipantSearchResultsComponent } from './edit-participant-search-results/edit-participant-search-results.component';

@NgModule({
    imports: [SharedModule],
    declarations: [EditParticipantSearchComponent, EditParticipantSearchResultsComponent],
    exports: [EditParticipantSearchComponent]
})
export class EditParticipantModule {}
