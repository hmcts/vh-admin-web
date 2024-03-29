import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnallocatedHearingsComponent } from './unallocated-hearings.component';
import {
    BHClient,
    DateForUnallocatedHearings,
    UnallocatedHearingsForVhoResponse,
    UserProfileResponse
} from '../../services/clients/api-client';
import { of, throwError } from 'rxjs';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('UnallocatedHearingsComponent', () => {
    let component: UnallocatedHearingsComponent;
    let fixture: ComponentFixture<UnallocatedHearingsComponent>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let logger: jasmine.SpyObj<Logger>;
    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

    const unallocatedHearings = new UnallocatedHearingsForVhoResponse({
        today: new DateForUnallocatedHearings({
            date_start: new Date(),
            date_end: new Date(),
            count: 1
        }),
        tomorrow: new DateForUnallocatedHearings({
            date_start: new Date(),
            date_end: new Date(),
            count: 2
        }),
        next7_days: new DateForUnallocatedHearings({
            date_start: new Date(),
            date_end: new Date(),
            count: 3
        }),
        next30_days: new DateForUnallocatedHearings({
            date_start: new Date(),
            date_end: new Date(),
            count: 5
        })
    });

    beforeEach(async () => {
        logger = jasmine.createSpyObj('Logger', ['error']);
        bHClientSpy = jasmine.createSpyObj('BHClient', ['getUnallocatedHearings']);
        bHClientSpy.getUnallocatedHearings.and.returnValue(of(unallocatedHearings));
        userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
        userIdentityServiceSpy.getUserInformation.and.returnValue(of(new UserProfileResponse({ is_vh_team_leader: true })));

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [UnallocatedHearingsComponent],
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: Logger, useValue: logger },
                { provide: UserIdentityService, useValue: userIdentityServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UnallocatedHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('Should attempt to retrieve unallocated hearings, and throw error', () => {
            bHClientSpy.getUnallocatedHearings.and.returnValue(throwError(new Error()));
            component.ngOnInit();
            expect(logger.error).toHaveBeenCalled();
        });

        it('Should retrieve unallocated hearings, and set model', () => {
            component.ngOnInit();
            expect(component.unallocatedHearings).toEqual(unallocatedHearings);
            expect(component.getTodayCount).toBe(1);
            expect(component.getTomorrowsCount).toBe(2);
            expect(component.getNext7DaysCount).toBe(3);
            expect(component.getNext30DaysCount).toBe(5);
        });
    });
});
