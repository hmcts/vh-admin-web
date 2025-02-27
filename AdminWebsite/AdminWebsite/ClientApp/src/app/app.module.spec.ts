import { TestBed } from '@angular/core/testing';
import { AppModule } from './app.module';
import { ConfigService } from './services/config.service';

describe('AppModule', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppModule],
            providers: [{ provide: ConfigService, useValue: { loadConfig: () => Promise.resolve() } }]
        }).compileComponents();
    });

    it('should compile AppModule', () => {
        expect(AppModule).toBeTruthy();
    });
});
