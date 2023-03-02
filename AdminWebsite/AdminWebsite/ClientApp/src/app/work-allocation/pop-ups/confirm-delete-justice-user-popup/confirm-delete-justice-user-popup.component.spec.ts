import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { ConfirmDeleteJusticeUserPopupComponent } from './confirm-delete-justice-user-popup.component';

describe('ConfirmDeleteJusticeUserPopupComponent', () => {
    const justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', ['addNewJusticeUser']);

    let component: ConfirmDeleteJusticeUserPopupComponent;
    let fixture: ComponentFixture<ConfirmDeleteJusticeUserPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmDeleteJusticeUserPopupComponent],
            providers: [{ provide: JusticeUsersService, useValue: justiceUsersServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDeleteJusticeUserPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
