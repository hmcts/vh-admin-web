import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { ConfirmRestoreJusticeUserPopupComponent } from './confirm-restore-justice-user-popup.component';
import { JusticeUserResponse } from 'src/app/services/clients/api-client';

describe('ConfirmRestoreJusticeUserPopupComponent', () => {
    const justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', ['restoreJusticeUser']);

    let component: ConfirmRestoreJusticeUserPopupComponent;
    let fixture: ComponentFixture<ConfirmRestoreJusticeUserPopupComponent>;
    const id = '123';
    const username = 'user@email.com';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmRestoreJusticeUserPopupComponent],
            providers: [{ provide: JusticeUsersService, useValue: justiceUsersServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmRestoreJusticeUserPopupComponent);
        component = fixture.componentInstance;
        component.user = {
            id,
            username
        } as any;
        fixture.detectChanges();
    });

    describe('onConfirmRestore', () => {
        it('should emit restore successful event on successful restore', () => {
            // Arrange
            const spy = spyOn(component.restoreSuccessfulEvent, 'emit');
            justiceUsersServiceSpy.restoreJusticeUser.and.returnValue(
                of(new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' }))
            );

            // Act
            component.onConfirmRestore();

            // Assert
            expect(component.isRestoring).toBeFalsy();
            expect(spy).toHaveBeenCalled();
            expect(component.failedRestoreMessage).toBeNull();
        });

        it('should show restore failed message on failed restore', () => {
            // Arrange
            justiceUsersServiceSpy.restoreJusticeUser.and.returnValue(throwError('error'));

            // Act
            component.onConfirmRestore();

            // Assert
            expect(component.isRestoring).toBeFalsy();
            expect(component.failedRestoreMessage).toBe(Constants.Error.RestoreJusticeUser.RestoreFailure);
        });
    });

    describe('onCancel', () => {
        it('should emit cancel event', () => {
            // Arrange
            const spy = spyOn(component.cancelEvent, 'emit');

            // Act
            component.onCancel();

            // Assert
            expect(spy).toHaveBeenCalled();
        });
    });
});
