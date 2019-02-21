import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { OtherInformationComponent } from './other-information.component';

let routerSpy: jasmine.SpyObj<Router>;

describe('OtherInformationComponent', () => {
  let component: OtherInformationComponent;
  let fixture: ComponentFixture<OtherInformationComponent>;

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ],
      declarations: [ OtherInformationComponent, BreadcrumbComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
