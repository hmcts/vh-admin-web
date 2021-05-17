import { NgModule } from '@angular/core';
import { GetAudioLinkButtonComponent } from './get-audio-link-button/get-audio-link-button.component';
import { SharedModule } from '../shared/shared.module';
import { HearingSearchDateTimePipe } from '../shared/directives/hearing-search-date-time.pipe';
import { HearingSearchResultsComponent } from './hearing-search-results/hearing-search-results.component';
import { GetAudioFileComponent } from './get-audio-file.component';
import { CvpAudioFileSearchResultComponent } from './cvp-audio-file-search-result/cvp-audio-file-search-result.component';
import { GetAudioFileCvpComponent } from './get-audio-file-cvp/get-audio-file-cvp.component';
import { GetAudioFileVhComponent } from './get-audio-file-vh/get-audio-file-vh.component';

@NgModule({
    imports: [SharedModule],
    declarations: [
        GetAudioFileComponent,
        GetAudioLinkButtonComponent,
        HearingSearchDateTimePipe,
        HearingSearchResultsComponent,
        CvpAudioFileSearchResultComponent,
        GetAudioFileCvpComponent,
        GetAudioFileVhComponent
    ],
    exports: [GetAudioFileComponent, GetAudioLinkButtonComponent, HearingSearchDateTimePipe, HearingSearchResultsComponent]
})
export class GetAudioFileModule {}
