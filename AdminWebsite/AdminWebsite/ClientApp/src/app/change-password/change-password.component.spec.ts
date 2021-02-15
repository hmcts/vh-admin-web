import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { UpdateUserPopupComponent } from '../popups/update-user-popup/update-user-popup.component';
import { Logger } from '../services/logger';
import { UserDataService } from '../services/user-data.service';
import { SharedModule } from '../shared/shared.module';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
    let component: ChangePasswordComponent;
    let fixture: ComponentFixture<ChangePasswordComponent>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let userDataServiceSpy: jasmine.SpyObj<UserDataService>;

    beforeEach(
        waitForAsync(() => {
            loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'warn', 'debug', 'info']);
            userDataServiceSpy = jasmine.createSpyObj<UserDataService>('UserDataService', ['updateUser']);

            userDataServiceSpy.updateUser.and.returnValue(of());

            TestBed.configureTestingModule({
                imports: [SharedModule, RouterTestingModule],
                declarations: [ChangePasswordComponent, UpdateUserPopupComponent],
                providers: [
                    { provide: Logger, useValue: loggerSpy },
                    { provide: UserDataService, useValue: userDataServiceSpy }
                ]
            }).compileComponents();
        })
    );

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
    it('should hide pop up if okay pressed', () => {
        component.okay();
        fixture.detectChanges();
        expect(component.showUpdateSuccess).toBeFalsy();
    });
    it('should input box to have focus if the input is invalid', async () => {
        component.goToDiv('userName');
        const input = fixture.nativeElement.querySelector('#userName');
        const activeElement = document.activeElement;
        fixture.detectChanges();
        expect(input).toBe(activeElement);
    });
    it('should on destroy unsubscribe the subscriptions', () => {
        component.userName.setValue('user.name@domain.com');
        component.updateUser();
        component.ngOnDestroy();
        expect(component.$subcription.closed).toBeTruthy();
    });
});
