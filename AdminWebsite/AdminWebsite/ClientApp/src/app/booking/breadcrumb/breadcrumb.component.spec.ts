import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from 'src/app/popups/confirmation-popup/confirmation-popup.component';
import { BHClient, ClientSettingsResponse } from 'src/app/services/clients/api-client';
import { SharedModule } from 'src/app/shared/shared.module';
import { FooterStubComponent } from 'src/app/testing/stubs/footer-stub';
import { HeaderStubComponent } from 'src/app/testing/stubs/header-stub';

import { routes } from '../../app-routing.module';
import { AppComponent } from '../../app.component';
import { CheckListComponent } from '../../check-list/check-list.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { LoginComponent } from '../../security/login.component';
import { LogoutComponent } from '../../security/logout.component';
import { ConfigService } from '../../services/config.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { AddParticipantComponent } from '../add-participant/add-participant.component';
import { AssignJudgeComponent } from '../assign-judge/assign-judge.component';
import { BookingConfirmationComponent } from '../booking-confirmation/booking-confirmation.component';
import { CreateHearingComponent } from '../create-hearing/create-hearing.component';
import { HearingScheduleComponent } from '../hearing-schedule/hearing-schedule.component';
import { OtherInformationComponent } from '../other-information/other-information.component';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { SummaryComponent } from '../summary/summary.component';
import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbItemModel } from './breadcrumbItem.model';
import { ContactUsStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { UnauthorisedComponent } from '../../error/unauthorised.component';

describe('BreadcrumbComponent', () => {
  const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
    ['getHearingMediums', 'getHearingTypes', 'getCurrentRequest', 'updateHearingRequest']);
  const bhClientSpy: jasmine.SpyObj<BHClient> = jasmine.createSpyObj<BHClient>('BHClient', ['getConfigSettings']);

  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/hearing-schedule'
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BreadcrumbComponent,
        AppComponent,
        DashboardComponent,
        LoginComponent,
        LogoutComponent,
        CreateHearingComponent,
        HearingScheduleComponent,
        AssignJudgeComponent,
        AddParticipantComponent,
        OtherInformationComponent,
        SearchEmailComponent,
        ParticipantsListComponent,
        CancelPopupComponent,
        SearchEmailComponent,
        ConfirmationPopupComponent,
        SummaryComponent,
        BookingConfirmationComponent,
        CheckListComponent,
        UnauthorisedComponent
      ],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: router },
        ConfigService,
        { provide: BHClient, useValue: bhClientSpy },
      ],
      imports: [RouterTestingModule.withRoutes(routes), SharedModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    const clientSettings = new ClientSettingsResponse();
    clientSettings.tenant_id = 'tenantId';
    clientSettings.client_id = 'clientId';
    clientSettings.post_logout_redirect_uri = '/dashboard';
    clientSettings.redirect_uri = '/dashboard';
    bhClientSpy.getConfigSettings.and.returnValue(Observable.create(clientSettings));

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    component.canNavigate = true;
    fixture.detectChanges();

  });

  it('should create breadcrumb component', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });
  it('breadcrumb component should have predifine navigation items', () => {
    component.ngOnInit();
    expect(component.breadcrumbItems.length).toBeGreaterThan(0);
  });
  it('breadcrumb component currentItem should match the current route and be type BreadcrumbItemModel', () => {
    component.ngOnInit();
    expect(component.currentRouter).toEqual('/hearing-schedule');
    expect(component.currentItem.Url).toEqual(component.currentRouter);
    expect(component.currentItem instanceof BreadcrumbItemModel).toBeTruthy();

  });
  it('breadcrumb component currentItem should have property Active set to true and proprty Value set to true', () => {
    component.ngOnInit();
    expect(component.currentItem.Active).toBeTruthy();
    expect(component.currentItem.Value).toBeTruthy();
  });
  it('next items should have property Active set to false and proprty Value set to false', () => {
    component.ngOnInit();
    for (const item of component.breadcrumbItems) {
      if (item.Url !== component.currentItem.Url && item.Id > component.currentItem.Id) {
        expect(item.Active).toBeFalsy();
        expect(item.Value).toBeFalsy();
      }
    }
  });
  it('previous items should have property Active set to true and proprty Value set to false', () => {
    component.currentItem = component.breadcrumbItems[2];
    component.ngOnInit();
    for (const item of component.breadcrumbItems) {
      if (item.Url !== component.currentItem.Url && item.Id < component.currentItem.Id) {
        expect(item.Active).toBeTruthy();
        expect(item.Value).toBeFalsy();
      }
    }
  });
  it('should not navigate to next route if canNavigate set to false', () => {
    component.ngOnInit();
    component.canNavigate = false;
    const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/hearing-schedule', false);
    component.clickBreadcrumbs(step);
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });
  it('should not navigate to next route if the difference between next item id and the current is greater than 1', () => {
    component.ngOnInit();
    component.canNavigate = false;
    const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false);
    component.clickBreadcrumbs(step);
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });
  it('should not navigate to next route if the next item with the given url is not found', () => {
    component.ngOnInit();
    component.canNavigate = false;
    const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/some-thing', false);
    component.clickBreadcrumbs(step);
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });
  it('should navigate to next route if canNavigate set to true and next item in correct order', () => {
    component.ngOnInit();
    const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false);
    component.clickBreadcrumbs(step);
    expect(router.navigate).toHaveBeenCalledWith(['/assign-judge']);
  });
});
