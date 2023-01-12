import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTeamComponent } from './manage-team.component';

describe('ManageTeamComponent', () => {
  let component: ManageTeamComponent;
  let fixture: ComponentFixture<ManageTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageTeamComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
