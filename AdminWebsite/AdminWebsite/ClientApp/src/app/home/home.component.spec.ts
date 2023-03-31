import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { OidcSecurityService } from 'angular-auth-oidc-client';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    const mockOidcSecurityService: MockOidcSecurityService = new MockOidcSecurityService();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HomeComponent],
            providers: [{ provide: OidcSecurityService, useValue: mockOidcSecurityService }]
        }).compileComponents();

        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
