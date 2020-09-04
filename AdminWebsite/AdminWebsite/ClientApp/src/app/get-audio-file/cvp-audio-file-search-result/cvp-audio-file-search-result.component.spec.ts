import { CvpAudioFileSearchResultComponent } from './cvp-audio-file-search-result.component';

describe('CvpAudioFileSearchResultComponent', () => {
    let component: CvpAudioFileSearchResultComponent;

    beforeEach(() => {
        component = new CvpAudioFileSearchResultComponent();
    });

    it('should return has results as false', function() {
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as false', function() {
        component.results = [];
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as true', function() {
        component.results = ['file name1', 'file name2'];
        expect(component.hasResults).toBeTruthy();
    });
});
