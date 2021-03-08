import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';

@Injectable({
    providedIn: 'root'
})
export class EmailValidationService {
    private readonly loggerPrefix = '[EmailValidationService] -';

    constructor(private configService: ConfigService, private logger: Logger) {}

    async getEmailPattern(): Promise<string> {
        const settings = await this.configService.getClientSettings().toPromise();
        const invalidPattern = settings.test_username_stem;
        if (!invalidPattern || invalidPattern.length === 0) {
            this.logger.error(`${this.loggerPrefix} Pattern to validate email is not set`, new Error('Email validation error'));
        } else {
            this.logger.info(`${this.loggerPrefix} Pattern to validate email is set with length ${invalidPattern.length}`);
        }

        return invalidPattern;
    }

    validateEmail(email: string, invalidPattern: string): boolean {
        /* tslint:disable: max-line-length */
        const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:[a-zA-Z0-9](?:\.[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        const isValidEmail =
            email &&
            email.length > 0 &&
            email.length < 256 &&
            pattern.test(email.toLowerCase()) &&
            email.toLowerCase().indexOf(invalidPattern) < 0;
        return isValidEmail;
    }
}
