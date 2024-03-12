import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReformLoginComponent } from './reform-login.component';
import { IdpProviders, SecurityService } from './services/security.service';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

describe('LoginReformComponent', () => {
    let component: ReformLoginComponent;
    let fixture: ComponentFixture<ReformLoginComponent>;
    let securityService: jasmine.SpyObj<SecurityService>;
    let routerSpy: jasmine.SpyObj<Router>;
    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        securityService = jasmine.createSpyObj<SecurityService>('SecurityService', ['currentIdpConfigId']);
        await TestBed.configureTestingModule({
            declarations: [ReformLoginComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: SecurityService, useValue: securityService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReformLoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(securityService.currentIdpConfigId).toBe(IdpProviders.reform);
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
});
