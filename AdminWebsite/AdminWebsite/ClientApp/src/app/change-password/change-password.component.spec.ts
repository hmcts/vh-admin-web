import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePasswordComponent } from './change-password.component';
import { AbstractControl } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { UpdateUserPopupComponent } from '../popups/update-user-popup/update-user-popup.component';
import { Logger } from '../services/logger';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let userNameControl: AbstractControl;
  let loggerSpy: jasmine.SpyObj<Logger>;

  beforeEach(async(() => {
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule
      ],
      declarations: [
        ChangePasswordComponent,
        UpdateUserPopupComponent
      ],
      providers: [
        { provide: Logger, useValue: loggerSpy },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    userNameControl = component.form.controls['userName'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
