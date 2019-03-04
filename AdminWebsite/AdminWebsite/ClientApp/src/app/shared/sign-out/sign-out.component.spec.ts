import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignOutComponent } from './sign-out.component';
import { VideoHearingsService } from '../../services/video-hearings.service';

describe('SignOutComponent', () => {
  let component: SignOutComponent;
  let fixture: ComponentFixture<SignOutComponent>;
  let debugElement: DebugElement;
  const videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['hasUnsavedChanges']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SignOutComponent],
      providers: [{ provide: VideoHearingsService, useValue: videoHearingServiceSpy }],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignOutComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

});
