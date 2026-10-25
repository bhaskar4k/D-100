import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class DatasetService {
    constructor(private http: HttpClient) { }

    GetAll(page: number, pageSize: number, search: string = ''): Observable<ApiResponseDto> {
        let params = new HttpParams().set('page', page).set('pageSize', pageSize);

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.GetAll, { params });
    }

    GetDeleted(page: number, pageSize: number, search: string = ''): Observable<ApiResponseDto> {
        let params = new HttpParams().set('page', page).set('pageSize', pageSize);

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.GetDeleted, { params });
    }

    Restore(datasetUid: string): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.Restore, { datasetUid });
    }

    Process(datasetUid: string): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.Process, { datasetUid });
    }

    Delete(datasetUid: string): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.Delete, { datasetUid });
    }

    GetDetails(datasetUid: string): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.GetDetails + '/' + encodeURIComponent(datasetUid));
    }

    Preview(datasetUid: string): Observable<ApiResponseDto> {
        return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.Preview + '/' + encodeURIComponent(datasetUid));
    }

    UpdateName(datasetUid: string, newName: string): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.UpdateName, { datasetUid, newName });
    }

    UpdateColumnName(datasetUid: string, columnId: number, newName: string): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.UpdateColumnName, { datasetUid, columnId, newName });
    }

    DeleteColumn(datasetUid: string, columnId: number): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Dataset.DeleteColumn, { datasetUid, columnId });
    }
}
