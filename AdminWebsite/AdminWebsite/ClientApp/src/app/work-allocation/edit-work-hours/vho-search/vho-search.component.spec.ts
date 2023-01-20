import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { VhoSearchComponent } from './vho-search.component';
import { VhoNonAvailabilityWorkHoursResponse } from '../../../services/clients/api-client';

import { UntypedFormBuilder } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { HoursType } from '../../../common/model/hours-type';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { Subject } from 'rxjs';
import { SearchResults } from '../search-results-model';
import { EditWorkHoursService } from '../../services/edit-work-hours.service';

describe('VhoSearchComponent', () => {
    let component: VhoSearchComponent;
    let fixture: ComponentFixture<VhoSearchComponent>;
    let service: jasmine.SpyObj<EditWorkHoursService>;
    let logger: jasmine.SpyObj<Logger>;
    let videoServiceSpy: jasmine.SpyObj<VideoHearingsService>;

    beforeEach(async () => {
        service = jasmine.createSpyObj('EditWorkHoursService', ['getWorkAvailabilityForVho', 'getNonWorkAvailabilityForVho']);
        service.fetchNonWorkHours$ = new Subject<boolean>();
        videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
            'cancelVhoNonAvailabiltiesRequest',
            'setVhoNonAvailabiltiesHaveChanged',
            'hasUnsavedVhoNonAvailabilityChanges'
        ]);
        logger = jasmine.createSpyObj('Logger', ['debug']);
        await TestBed.configureTestingModule({
            declarations: [VhoSearchComponent],
            providers: [
                UntypedFormBuilder,
                { provide: Logger, useValue: logger },
                { provide: EditWorkHoursService, useValue: service },
                { provide: VideoHearingsService, useValue: videoServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoSearchComponent);
        component = fixture.componentInstance;
        spyOn(component, 'clear');
        component.hoursTypeEmitter = jasmine.createSpyObj('hoursTypeEmitter', ['emit']);
        component.vhoSearchEmitter = jasmine.createSpyObj('vhoSearchEmitter', ['emit']);
        component.dataChange = jasmine.createSpyObj('dataChange', ['emit']);
        component.usernameEmitter = jasmine.createSpyObj('usernameEmitter', ['emit']);
        fixture.detectChanges();

        component.workingOptionRef = jasmine.createSpyObj('workingOptionRef', ['nativeElement']);
        component.workingOptionRef.nativeElement = jasmine.createSpyObj('nativeElement', ['focus', 'click']);

        component.nonWorkingOptionRef = jasmine.createSpyObj('nonWorkingOptionRef', ['nativeElement']);
        component.nonWorkingOptionRef.nativeElement = jasmine.createSpyObj('nativeElement', ['focus', 'click']);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should reload non work hours when fetchNonWorkHours event streamed', fakeAsync(() => {
            const vhoSearchResult: SearchResults = { result: [], refresh: true };
            component.ngOnInit();
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult.result);
            fixture.detectChanges();

            service.fetchNonWorkHours$.next(true);
            tick();

            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith(vhoSearchResult);
        }));
    });

    describe('search tests working hours', () => {
        it('should call searchForVho and emit vhoSearchResult', async () => {
            const vhoSearchResult: SearchResults = { result: [], refresh: false };

            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });

            service.getWorkAvailabilityForVho.and.returnValue(vhoSearchResult.result);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith(vhoSearchResult);
            expect(component.usernameEmitter.emit).toHaveBeenCalledWith('username');
        });

        it('should call searchForVho return null and set the error message', async () => {
            const vhoSearchResult = null;

            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });

            service.getWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.clear).toHaveBeenCalled();
            expect(component.error).toBe('User could not be found. Please check the username and try again');
        });

        it('should call searchForVho and throw exception', async () => {
            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });

            service.getWorkAvailabilityForVho.and.throwError('bad request');

            await component.search().catch(err => {
                expect(component).toBeTruthy();
                expect(service.getWorkAvailabilityForVho).toHaveBeenCalled();

                expect(component.vhoSearchEmitter.emit).toHaveBeenCalledTimes(0);
                expect(component.error).toBe('bad request');
            });
        });
    });

    describe('search tests non working hours', () => {
        it('should call searchForVho and emit events', async () => {
            const vhoSearchResult: SearchResults = { result: [], refresh: false };
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult.result);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.hoursTypeEmitter.emit).toHaveBeenCalledWith(HoursType.NonWorkingHours);
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith(vhoSearchResult);
        });
        it('should sort the dates in chronological order ', async () => {
            const vhoSearchResult: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult);
            vhoSearchResult.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-03-08T17:53:01.8455023')
                })
            );
            vhoSearchResult.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-01-08T14:53:01.8455023')
                })
            );
            vhoSearchResult.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-09-08T14:53:01.8455023')
                })
            );
            await component.search();

            const vhoSortedDates: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            vhoSortedDates.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-01-08T14:53:01.8455023')
                })
            );
            vhoSortedDates.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-03-08T17:53:01.8455023')
                })
            );
            vhoSortedDates.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    start_time: new Date('2022-09-08T14:53:01.8455023')
                })
            );
            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith({ result: vhoSortedDates, refresh: false });
        });
        it('should call searchForVho return null and set the error message', async () => {
            const vhoSearchResult = null;
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.clear).toHaveBeenCalled();
            expect(component.error).toBe('User could not be found. Please check the username and try again');
        });

        it('should call searchForVho and throw exception', async () => {
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.throwError('bad request');

            await component.search().catch(err => {
                expect(component).toBeTruthy();
                expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();

                expect(component.vhoSearchEmitter.emit).toHaveBeenCalledTimes(0);
                expect(component.error).toBe('bad request');
            });
        });

        it('should call handleContinue and click on working Option', async () => {
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });

            await component.handleContinue();

            expect(component).toBeTruthy();
            expect(component.workingOptionRef.nativeElement.focus).toHaveBeenCalled();
            expect(component.dataChange.emit).toHaveBeenCalledWith(false);
        });

        it('should call handleContinue and click on non working Option', async () => {
            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });

            await component.handleContinue();

            expect(component).toBeTruthy();
            expect(component.nonWorkingOptionRef.nativeElement.focus).toHaveBeenCalled();
            expect(component.dataChange.emit).toHaveBeenCalledWith(false);
        });

        it('should call cancelEditing and emit dataChange', async () => {
            await component.cancelEditing();

            expect(component).toBeTruthy();
            expect(component.dataChange.emit).toHaveBeenCalledWith(false);
        });

        it('should call changeSearch and emit dataChange if data is Changed', async () => {
            videoServiceSpy.hasUnsavedVhoNonAvailabilityChanges.and.returnValue(true);

            await component.changeSearch();

            expect(component).toBeTruthy();
            expect(component.dataChange.emit).toHaveBeenCalledWith(true);
        });

        it('should call changeSearch and not emit dataChange if data is not Changed', async () => {
            videoServiceSpy.hasUnsavedVhoNonAvailabilityChanges.and.returnValue(false);

            await component.changeSearch();

            expect(component).toBeTruthy();
            expect(component.dataChange.emit).toHaveBeenCalledTimes(0);
        });
    });
});
