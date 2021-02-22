import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RemoveInterpreterPopupComponent } from './remove-interpreter-popup.component';

describe('RemoveInterpreterPopupComponent', () => {
    let component: RemoveInterpreterPopupComponent;
    let fixture: ComponentFixture<RemoveInterpreterPopupComponent>;
    let de: DebugElement;
    let buttonConfirm: ElementRef;
    let buttonCancel: ElementRef;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveInterpreterPopupComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveInterpreterPopupComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
        buttonConfirm = de.query(By.css('#btnConfirmRemoveInterpreter'));
        de = fixture.debugElement;
        buttonCancel = de.query(By.css('#btnCancelRemoveInterpreter'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should emit event when the remove interpreter button is clicked', () => {
        spyOn(component.continueRemove, 'emit');
        buttonConfirm.nativeElement.click();
        expect(component.continueRemove.emit).toHaveBeenCalled();
    });
    it('should emit event when the cancel remove button is clicked', () => {
        spyOn(component.cancelRemove, 'emit');
        buttonCancel.nativeElement.click();
        expect(component.cancelRemove.emit).toHaveBeenCalled();
    });
});
