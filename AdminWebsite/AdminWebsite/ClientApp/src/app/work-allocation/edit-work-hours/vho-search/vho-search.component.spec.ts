import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VhoSearchComponent } from './vho-search.component';
import { EditWorkHoursService } from '../../../services/edit-work-hours.service';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { FormBuilder } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { HoursType } from '../../../common/model/hours-type';

describe('VhoSearchComponent', () => {
    let component: VhoSearchComponent;
    let fixture: ComponentFixture<VhoSearchComponent>;
    let service: jasmine.SpyObj<EditWorkHoursService>;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(async () => {
        service = jasmine.createSpyObj('EditWorkHoursService', ['getWorkAvailabilityForVho', 'getNonWorkAvailabilityForVho']);
        logger = jasmine.createSpyObj('Logger', ['debug']);
        await TestBed.configureTestingModule({
            declarations: [VhoSearchComponent],
            providers: [FormBuilder, { provide: Logger, useValue: logger }, { provide: EditWorkHoursService, useValue: service }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoSearchComponent);
        component = fixture.componentInstance;
        component.vhoSearchEmitter = jasmine.createSpyObj('vhoSearchEmitter', ['emit']);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('search tests working hours', () => {
        it('should call searchForVho and emit vhoSearchResult', async () => {
            const vhoSearchResult: Array<VhoWorkHoursResponse> = [];
            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });
            service.getWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith(vhoSearchResult);
        });

        it('should call searchForVho return null and set the error message', async () => {
            const vhoSearchResult = null;
            component.form.setValue({ hoursType: HoursType.WorkingHours, username: 'username' });
            service.getWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledTimes(0);
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
        it('should call searchForVho and emit vhoSearchResult', async () => {
            const vhoSearchResult: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledWith(vhoSearchResult);
        });

        it('should call searchForVho return null and set the error message', async () => {
            const vhoSearchResult = null;
            component.form.setValue({ hoursType: HoursType.NonWorkingHours, username: 'username' });
            service.getNonWorkAvailabilityForVho.and.returnValue(vhoSearchResult);

            await component.search();

            expect(component).toBeTruthy();
            expect(service.getNonWorkAvailabilityForVho).toHaveBeenCalled();
            expect(component.vhoSearchEmitter.emit).toHaveBeenCalledTimes(0);
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
    });
});
