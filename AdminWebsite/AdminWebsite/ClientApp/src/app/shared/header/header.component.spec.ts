import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SignOutComponent } from '../sign-out/sign-out.component';
import { NO_ERRORS_SCHEMA, DebugElement  } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let debugElement: DebugElement;
  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent, SignOutComponent],
      providers: [{ provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the head component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
  it('header component should have top menu items', () => {
    fixture.detectChanges();
    component.topMenuItems = [];
    component.ngOnInit();
    expect(component.topMenuItems.length).toBeGreaterThan(0);
  });
  it('selected top menu item has active property set to true, others item active set to false', () => {
    component.topMenuItems = [];
    component.ngOnInit();
    component.navigateToSelectedMenuItem(0);
    expect(component.topMenuItems[0].active).toBeTruthy();
    if (component.topMenuItems.length > 1) {
      for (const item of component.topMenuItems.slice(1)) {
        expect(item.active).toBeFalsy();
      }
    }
  });
  it('user should navigate by selecting top menu item', () => {
    component.ngOnInit();
    component.navigateToSelectedMenuItem(0);
    expect(router.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
  });
  it('user should see Signout button once logged in', () => {
    component.ngOnInit();
    component.loggedIn = true;
    fixture.detectChanges();
    debugElement = fixture.debugElement;
    const signOutElement = debugElement.queryAll(By.css('#linkSignOut'));
    expect(signOutElement.length).toBeGreaterThan(0);
    const el = signOutElement[0].nativeElement as HTMLElement;
    expect(el.innerHTML).toContain('Sign out');
  });
  it('user should not see Signout button if not logged in', () => {
    component.ngOnInit();
    component.loggedIn = false;
    fixture.detectChanges();
    debugElement = fixture.debugElement;
    const signOutElement = debugElement.queryAll(By.css('#linkSignOut'));
    expect(signOutElement.length).toBe(0);
  });
});
