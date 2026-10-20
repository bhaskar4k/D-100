import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { Observable } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    constructor(private http: HttpClient) { }

    GetMenu(): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Common.GetMenu);
    }
}
