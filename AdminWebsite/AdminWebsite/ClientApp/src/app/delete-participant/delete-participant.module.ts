import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DeleteParticipantSearchResultsComponent } from './delete-participant-search-results/delete-participant-search-results.component';
import { DeleteParticipantSearchComponent } from './delete-participant-search/delete-participant-search.component';

@NgModule({
    imports: [SharedModule],
    declarations: [DeleteParticipantSearchComponent, DeleteParticipantSearchResultsComponent],
    exports: [DeleteParticipantSearchComponent]
})
export class DeleteParticipantModule {}
