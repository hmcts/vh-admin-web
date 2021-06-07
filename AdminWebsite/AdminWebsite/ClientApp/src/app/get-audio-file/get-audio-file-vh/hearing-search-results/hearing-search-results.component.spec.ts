import { HearingAudioSearchModel } from 'src/app/common/model/hearing-audio-search-model';
import { HearingSearchResultsComponent } from './hearing-search-results.component';

describe('HearingSearchResultsComponent', () => {
    let component: HearingSearchResultsComponent;

    beforeEach(() => {
        component = new HearingSearchResultsComponent();
    });

    it('should return has results as false', function () {
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as false', function () {
        component.results = [];
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as true', function () {
        component.results = [
            new HearingAudioSearchModel({
                init(_data?: any): void {},
                toJSON(data?: any): any {},
                id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC2'
            })
        ];
        expect(component.hasResults).toBeTruthy();
    });
});
