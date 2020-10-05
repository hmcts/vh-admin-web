import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordComponent } from './change-password.component';
import { SharedModule } from '../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { UpdateUserPopupComponent } from '../popups/update-user-popup/update-user-popup.component';
import { Logger } from '../services/logger';
import { UserDataService } from '../services/user-data.service';
import { of, throwError } from 'rxjs';
import { UpdateUserPasswordResponse } from '../services/clients/api-client';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let loggerSpy: jasmine.SpyObj<Logger>;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;

  beforeEach(async(() => {
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);
    userDataServiceSpy = jasmine.createSpyObj<UserDataService>('UserDataService', ['updateUser']);

    const updateUserPasswordResponse = new UpdateUserPasswordResponse();
    updateUserPasswordResponse.password = 'MyNewPassword';
    userDataServiceSpy.updateUser.and.returnValue(of(updateUserPasswordResponse));

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
        { provide: UserDataService, useValue: userDataServiceSpy },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should validate the username as email', () => {
    component.userName.setValue('user.name.domain.com');
    component.userNameOnBlur();
    fixture.detectChanges();
    expect(component.isValidEmail).toBe(false);
  });
  it('should show a error message if username is blank', () => {
    component.userName.setValue('');
    component.updateUser();
    fixture.detectChanges();
    expect(component.failedSubmission).toBe(true);
  });
  it('should show a save success if password was updated.', () => {
    component.userName.setValue('user.name@domain.com');
    component.updateUser();
    fixture.detectChanges();
    expect(userDataServiceSpy.updateUser).toHaveBeenCalled();
  });
    it('should show copy password button when updated.', () => {
        component.userName.setValue('user.name@domain.com');
        component.updateUser();
        fixture.detectChanges();
        expect(userDataServiceSpy.updateUser).toHaveBeenCalled();
        expect(component.showCopyPasswordButton).toBeTruthy();
        expect(component.password).not.toBeNull();
    });
  it('should hide pop up if okay pressed', () => {
    component.okay();
    fixture.detectChanges();
    expect(component.showUpdateSuccess).toBeFalsy();
  });
  it('should input box to have focus if the input is invalid', async() => {
    component.goToDiv('userName');
    const input = fixture.nativeElement.querySelector('#userName:focus');
    fixture.detectChanges();
    expect(input).toBeTruthy();
  });
  it('should on destroy unsubscribe the subscriptions', () => {
    component.userName.setValue('user.name@domain.com');
    component.updateUser();
    component.ngOnDestroy();
    expect(component.$subcription.closed).toBeTruthy();
  });
});
