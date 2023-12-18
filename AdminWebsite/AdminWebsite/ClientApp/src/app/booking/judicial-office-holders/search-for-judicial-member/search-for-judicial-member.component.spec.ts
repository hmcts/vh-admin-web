import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPerson } from 'src/app/services/clients/api-client';
import { SearchForJudicialMemberComponent } from './search-for-judicial-member.component';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

describe('SearchForJudicialMemberComponent', () => {
    let component: SearchForJudicialMemberComponent;
    let fixture: ComponentFixture<SearchForJudicialMemberComponent>;
    let judicialServiceSpy: jasmine.SpyObj<JudicialService>;

    beforeEach(async () => {
        judicialServiceSpy = jasmine.createSpyObj('JudicialService', ['getJudicialUsers']);
        judicialServiceSpy.getJudicialUsers.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [SearchForJudicialMemberComponent],
            providers: [{ provide: JudicialService, useValue: judicialServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchForJudicialMemberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('existingJudicialMember', () => {
        it('should set form values and disable judiciaryEmail control when existingJudicialMember is set', () => {
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234');
            judicialMember.displayName = 'Test User display name';
            judicialMember.roleCode = 'Judge';
            component.existingJudicialMember = judicialMember;
            expect(component.form.controls.judiciaryEmail.value).toBe(judicialMember.email);
            expect(component.form.controls.displayName.value).toBe(judicialMember.displayName);
            expect(component.form.controls.judiciaryEmail.disabled).toBeTrue();
        });

        it('should reset form values and enable judiciaryEmail control when existingJudicialMember is not set', () => {
            component.existingJudicialMember = null;
            expect(component.form.controls.judiciaryEmail.value).toBe('');
            expect(component.form.controls.displayName.value).toBe('');
            expect(component.form.controls.judiciaryEmail.enabled).toBeTrue();
        });
    });

    describe('searchForJudicialMember', () => {
        it('should call judicialService.getJudicialUsers with the correct email and set searchResult and showResult', () => {
            const email = 'test@test.com';
            const searchResult: JudiciaryPerson[] = [
                new JudiciaryPerson({
                    email: 'test@test.com',
                    full_name: 'Test User',
                    title: 'Mr',
                    first_name: 'Test',
                    last_name: 'User',
                    personal_code: '1234',
                    work_phone: '1234567890'
                })
            ];
            judicialServiceSpy.getJudicialUsers.and.returnValue(of(searchResult));

            component.form.controls.judiciaryEmail.setValue(email);
            component.searchForJudicialMember();

            expect(judicialServiceSpy.getJudicialUsers).toHaveBeenCalledWith(email);
            expect(component.searchResult).toEqual(searchResult);
            expect(component.showResult).toBeTrue();
            expect(component.form.controls.displayName.hasValidator(Validators.required)).toBeTrue();
        });

        it('should call judicialService.getJudicialUsers with the correct email and ignore existing judiciary memebrs and showResult', () => {
            const email = 'test@test.com';
            const judiciaryPerson = new JudiciaryPerson({
                email: 'test@test.com',
                full_name: 'Test User',
                title: 'Mr',
                first_name: 'Test',
                last_name: 'User',
                personal_code: '1234',
                work_phone: '1234567890'
            });
            const searchResult: JudiciaryPerson[] = [judiciaryPerson];
            judicialServiceSpy.getJudicialUsers.and.returnValue(of(searchResult));
            component.existingJudicialMembers = [
                new JudicialMemberDto(
                    judiciaryPerson.first_name,
                    judiciaryPerson.last_name,
                    judiciaryPerson.full_name,
                    judiciaryPerson.email,
                    judiciaryPerson.work_phone,
                    judiciaryPerson.personal_code
                )
            ];

            component.form.controls.judiciaryEmail.setValue(email);
            component.searchForJudicialMember();

            expect(judicialServiceSpy.getJudicialUsers).toHaveBeenCalledWith(email);
            expect(component.searchResult).toEqual([]);
            expect(component.showResult).toBeTrue();
            expect(component.form.controls.displayName.hasValidator(Validators.required)).toBeTrue();
        });
    });

    describe('selectJudicialMember', () => {
        it('should set form values and emit judicialMemberSelected event with the correct values', () => {
            const judicialMember: JudiciaryPerson = new JudiciaryPerson({
                email: 'test@test.com',
                full_name: 'Test User',
                title: 'Mr',
                first_name: 'Test',
                last_name: 'User',
                personal_code: '1234',
                work_phone: '1234567890'
            });
            const expectedJudicialMember = new JudicialMemberDto(
                judicialMember.first_name,
                judicialMember.last_name,
                judicialMember.full_name,
                judicialMember.email,
                judicialMember.work_phone,
                judicialMember.personal_code
            );
            spyOn(component.judicialMemberSelected, 'emit');

            component.selectJudicialMember(judicialMember);

            expect(component.form.value.judiciaryEmail).toBe(judicialMember.email);
            expect(component.form.value.displayName).toBe(judicialMember.full_name);
            expect(component.showResult).toBeFalse();
        });
    });

    describe('confirmJudiciaryMemberWithDisplayName', () => {
        it('should set judicialMember displayName and emit judicialMemberSelected event with the correct values', () => {
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234');
            const displayName = 'Test User';
            spyOn(component.judicialMemberSelected, 'emit');

            component['judicialMember'] = judicialMember;
            component.form.controls.displayName.setValue(displayName);
            component.confirmJudiciaryMemberWithDisplayName();

            expect(component['judicialMember'].displayName).toBe(displayName);
            expect(component.judicialMemberSelected.emit).toHaveBeenCalledWith(judicialMember);
            expect(component.form.value.judiciaryEmail).toBe('');
            expect(component.form.value.displayName).toBe('');
            expect(component.form.controls.displayName.hasValidator(Validators.required)).toBeFalse();
        });
    });

    describe('createForm', () => {
        it('should create a form with the correct controls and validators', () => {
            component.createForm();

            expect(component.form.controls.judiciaryEmail).toBeDefined();
            expect(component.form.controls.judiciaryEmail.value).toBe('');
            expect(component.form.controls.judiciaryEmail.hasValidator(Validators.required)).toBeTrue();

            expect(component.form.controls.displayName).toBeDefined();
            expect(component.form.controls.displayName.value).toBe('');
            expect(component.form.controls.displayName.hasValidator(Validators.required)).toBeFalse();
        });

        it('should remove displayName required validator and reset form when judiciaryEmail is empty', fakeAsync(() => {
            spyOn(component.form.controls.displayName, 'removeValidators');
            spyOn(component.form, 'reset');

            component.form.controls.judiciaryEmail.setValue('');
            component.form.controls.judiciaryEmail.updateValueAndValidity();

            tick(component.NotificationDelayTime);

            expect(component.showResult).toBeFalse();
            expect(component.form.controls.displayName.removeValidators).toHaveBeenCalledWith(Validators.required);
            expect(component.form.reset).toHaveBeenCalledWith({
                judiciaryEmail: '',
                displayName: ''
            });
        }));

        it('should not search for judicial member when judiciaryEmail is invalid', () => {
            component.form.controls.judiciaryEmail.setValue('te');
            component.form.controls.judiciaryEmail.updateValueAndValidity();

            expect(component.showResult).toBeFalse();
            expect(judicialServiceSpy.getJudicialUsers).not.toHaveBeenCalled();
        });

        it('should not search for judicial member when in edit mode', () => {
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234');
            judicialMember.displayName = 'Test User display name';
            judicialMember.roleCode = 'Judge';
            component.existingJudicialMember = judicialMember;

            component.form.controls.judiciaryEmail.setValue('test@test.com');
            component.form.controls.judiciaryEmail.updateValueAndValidity();

            expect(component.showResult).toBeFalse();
            expect(judicialServiceSpy.getJudicialUsers).not.toHaveBeenCalled();
        });

        it('should search for judicial member when judiciaryEmail is valid and not in edit mode', fakeAsync(() => {
            component.form.controls.judiciaryEmail.setValue('test@test.com');
            component.form.controls.judiciaryEmail.updateValueAndValidity();

            tick(component.NotificationDelayTime);

            expect(component.showResult).toBeTrue();
            expect(judicialServiceSpy.getJudicialUsers).toHaveBeenCalledWith('test@test.com');
        }));

        it('displayNameFieldHasError should return true when displayName is invalid, then show false for a valid one', () => {
            const invalidDisplayNames = ['!', 'Test//User ', 'Test#####'];
            invalidDisplayNames.forEach(displayName => {
                component.form.controls.displayName.markAsDirty();
                component.form.controls.displayName.setValue(displayName);
                component.form.controls.displayName.updateValueAndValidity();
                expect(component.displayNameFieldHasError).toBeTrue();
            });
            component.form.controls.displayName.setValue('Test User');
            fixture.detectChanges();
            expect(component.displayNameFieldHasError).toBeFalse();
        });
    });
});
