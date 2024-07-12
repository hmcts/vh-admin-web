import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BH_API_BASE_URL } from './api-client';

@Injectable({
    providedIn: 'root'
})
export class HealthCheckClient {
    private healthUrl: string;
    private options: any;
    constructor(private http: HttpClient, @Optional() @Inject(BH_API_BASE_URL) baseUrl?: string) {
        baseUrl = baseUrl !== undefined && baseUrl !== null ? baseUrl : 'https://localhost:5400';
        this.healthUrl = `${baseUrl}/health/readiness`;
        this.options = {
            headers: new HttpHeaders({
                Accept: 'application/json',
                Cache: 'no-cache'
            })
        };
    }
    getHealth(): Observable<any> {
        return this.http.get<any>(this.healthUrl, this.options);
    }
}
