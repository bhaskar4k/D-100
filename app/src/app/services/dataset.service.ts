import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class DatasetService {
    constructor(private http: HttpClient) { }

    GetAll(page: number, pageSize: number): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.GetAll, {
            params: { page, pageSize }
        });
    }
}
