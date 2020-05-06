import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';
import { AudioLinkService } from '../services/audio-link-service';

@Component({
    selector: 'app-get-audio-file',
    templateUrl: './get-audio-file.component.html',
    styleUrls: ['./get-audio-file.component.scss']
})
export class GetAudioFileComponent implements OnInit, AfterViewInit {
    form: FormGroup;
    hasSearched: boolean;
    loadingData: boolean;
    results: HearingAudioSearchModel[] = [];

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService) {
        this.loadingData = false;
        this.hasSearched = false;
    }

    async ngOnInit(): Promise<void> {
        this.form = this.fb.group({
            caseNumber: ['11111', Validators.required]
        });
    }

    get caseNumber() {
        return this.form.get('caseNumber');
    }

    @ViewChild('tooltip', { static: false }) mySpan: ElementRef;

    ngAfterViewInit() {
        console.log('Hello ', this.mySpan.nativeElement);
    }

    onMouseMove(e) {
        // console.log(e);
        const x = e.layerX;
        const y = e.layerY;
        this.mySpan.nativeElement.style.top = y + -100 + 'px';
        this.mySpan.nativeElement.style.left = x + 100 + 'px';
    }

    onMouseOver(e) {
        console.log(e);
        this.mySpan.nativeElement.style.display = 'block';
        // this.mySpan.nativeElement.style.top = e.offsetY;
        // this.mySpan.nativeElement.style.left = e.offsetX;
    }

    onMouseLeave() {
        this.mySpan.nativeElement.style.display = 'none';
    }

    async search() {
        if (this.form.valid) {
            this.loadingData = true;
            this.hasSearched = false;

            this.results = await this.getResults(this.caseNumber.value);

            this.hasSearched = true;
            this.loadingData = false;
        }
    }

    async getResults(caseNumber: string): Promise<HearingAudioSearchModel[]> {
        const response = await this.audioLinkService.getHearingsByCaseNumber(caseNumber);

        if (response === null) {
            return [];
        }

        return response.map((x) => {
            return new HearingAudioSearchModel(x);
        });
    }
}
