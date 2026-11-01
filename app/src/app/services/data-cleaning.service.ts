import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class DataCleaningService {
    constructor(private http: HttpClient) { }

    GetMissingValueReplacementStrategies(): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(
            GetBaseURL() + Endpoints.DataCleaning.GetMissingValueReplacementStrategies
        );
    }
}
