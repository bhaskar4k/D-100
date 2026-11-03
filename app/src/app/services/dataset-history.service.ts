import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class DatasetHistoryService {
    constructor(private http: HttpClient) { }

    GetHistory(datasetUid: string, actionType: string): Observable<ApiResponseDto> {
        const params = new HttpParams()
            .set('datasetUid', datasetUid)
            .set('actionType', actionType);

        return this.http.get<ApiResponseDto>(
            GetBaseURL() + Endpoints.DatasetHistory.GetHistory,
            { params }
        );
    }
}
