import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AbstractControl } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { OtherInformationComponent } from './other-information.component';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { CancelPopupStubComponent } from 'src/app/testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from 'src/app/testing/stubs/confirmation-popup-stub';
import { SharedModule } from 'src/app/shared/shared.module';
import { HearingModel } from '../../common/model/hearing.model';

let routerSpy: jasmine.SpyObj<Router>;
let otherInformation: AbstractControl;
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;

let hearing = new HearingModel();
hearing.other_information = 'some text';

describe('OtherInformationComponent', () => {
  let component: OtherInformationComponent;
  let fixture: ComponentFixture<OtherInformationComponent>;
  videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
    ['getCurrentRequest', 'cancelRequest', 'updateHearingRequest']);

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
      ],
      declarations: [
        OtherInformationComponent,
        BreadcrumbComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent
      ]
    })
      .compileComponents();
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    otherInformation = component.otherInformationForm.controls['otherInformation'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set initiall values for field', () => {
    component.ngOnInit();
    expect(otherInformation.value).toBe('some text');
    expect(component.otherInformationText).toBe('some text');
  });
  it('if press next button should save other information in storage and navigat to summary page.', () => {
    component.ngOnInit();
    component.next();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();

  });
  it('if press cancel button should remove other information from storage and navigat to dushboard page.', () => {
    component.ngOnInit();
    component.otherInformationCancel();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
  });
});
