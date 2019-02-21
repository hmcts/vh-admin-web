import { Injectable } from '@angular/core';
import { BHClient, ChecklistsResponse } from '../services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {

  constructor(private bhClient: BHClient) { }

  getChecklists(page: number, pageSize: number): Observable<ChecklistsResponse> {
    return this.bhClient.getAllParticipantsChecklists(pageSize, page);
  }
}
