import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { ConfirmDeleteJusticeUserPopupComponent } from './confirm-delete-justice-user-popup.component';

describe('ConfirmDeleteJusticeUserPopupComponent', () => {
    const justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', ['deleteJusticeUser']);

    let component: ConfirmDeleteJusticeUserPopupComponent;
    let fixture: ComponentFixture<ConfirmDeleteJusticeUserPopupComponent>;
    const userId = '123';
    const username = 'user@email.com';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmDeleteJusticeUserPopupComponent],
            providers: [{ provide: JusticeUsersService, useValue: justiceUsersServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDeleteJusticeUserPopupComponent);
        component = fixture.componentInstance;
        component.userId = userId;
        component.username = username;
        fixture.detectChanges();
    });

    describe('onConfirmDelete', () => {
        it('should emit delete successful event on successful delete', () => {
            // Arrange
            const spy = spyOn(component.deleteSuccessfulEvent, 'emit');
            justiceUsersServiceSpy.deleteJusticeUser.and.returnValue(of(''));

            // Act
            component.onConfirmDelete();

            // Assert
            expect(component.showSpinner).toBeFalsy();
            expect(spy).toHaveBeenCalled();
            expect(component.failedDeleteMessage).toBeNull();
        });

        it('should show delete failed message on failed delete', () => {
            // Arrange
            justiceUsersServiceSpy.deleteJusticeUser.and.returnValue(throwError('error'))

            // Act
            component.onConfirmDelete();

            // Assert
            expect(component.showSpinner).toBeFalsy();
            expect(component.failedDeleteMessage).toBe(Constants.Error.DeleteJusticeUser.DeleteFailure);
        })
    });

    describe('onCancel', () => {
        it('should emit event', () => {
            // Arrange
            const spy = spyOn(component.cancelEvent, 'emit');

            // Act
            component.onCancel();

            // Assert
            expect(spy).toHaveBeenCalled();
        });
    });
});
