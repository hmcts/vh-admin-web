import { NgModule } from '@angular/core';
import { GetAudioLinkButtonComponent } from './get-audio-link-button/get-audio-link-button.component';
import { SharedModule } from '../shared/shared.module';
import { HearingSearchDateTimePipe } from '../shared/directives/hearing-search-date-time.pipe';
import { HearingSearchResultsComponent } from './hearing-search-results/hearing-search-results.component';
import { GetAudioFileComponent } from './get-audio-file.component';

@NgModule({
    imports: [SharedModule],
    declarations: [GetAudioFileComponent, GetAudioLinkButtonComponent, HearingSearchDateTimePipe, HearingSearchResultsComponent],
    exports: [GetAudioFileComponent, GetAudioLinkButtonComponent, HearingSearchDateTimePipe, HearingSearchResultsComponent]
})
export class GetAudioFileModule {}
