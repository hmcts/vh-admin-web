import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UpdateUserPopupComponent } from './update-user-popup.component';

describe('UpdateUserSuccessPopupComponent', () => {
    let component: UpdateUserPopupComponent;
    let fixture: ComponentFixture<UpdateUserPopupComponent>;
    let de: DebugElement;
    let buttonOkay: ElementRef;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [UpdateUserPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(UpdateUserPopupComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
        buttonOkay = de.query(By.css('#btnOkay'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should emit event when the okay button is clicked', () => {
        spyOn(component.okay, 'emit');
        buttonOkay.nativeElement.click();
        expect(component.okay.emit).toHaveBeenCalled();
    });
});
