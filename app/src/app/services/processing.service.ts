import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class ProcessingService {
    constructor(private http: HttpClient) { }

    GetQueueStatus(): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Processing.GetQueueStatus);
    }
}
