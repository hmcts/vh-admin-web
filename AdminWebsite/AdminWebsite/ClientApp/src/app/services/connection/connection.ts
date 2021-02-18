import { InjectionToken } from '@angular/core';

export interface ConnectionServiceConfig {
    url?: string;
    interval?: number;
    retryInterval?: number;
    maxRetryAttempts?: number;
}

export const ConnectionServiceConfigToken: InjectionToken<ConnectionServiceConfig> = new InjectionToken('ConnectionServiceConfigToken');
