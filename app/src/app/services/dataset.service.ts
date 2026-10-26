import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
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

    PrepareDownloadIngestedDataset(datasetUid: string, downloadedFileType: number): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(
            GetBaseURL() + Endpoints.Dataset.PrepareDownloadIngestedDataset,
            { datasetUid, downloadedFileType }
        );
    }

    // Streams a single file (CSV / Parquet) or a zip of Excel chunks from the ingest parquet.
    // We use HttpClient so the JWT interceptor attaches the Bearer header, and ask for a blob
    // so the browser can save the response regardless of content type.
    DownloadIngestedDatasetBlob(datasetUid: string): Observable<HttpResponse<Blob>> {
        return this.http.get(
            GetBaseURL() + Endpoints.Dataset.DownloadIngestedDataset + '/' + encodeURIComponent(datasetUid),
            { observe: 'response', responseType: 'blob' }
        );
    }

    // Streams the original uploaded file as-is. Used for unprocessed datasets, where no
    // parquet mirror exists yet, so the format picker and Python conversion are both skipped.
    DownloadRawDatasetBlob(datasetUid: string): Observable<HttpResponse<Blob>> {
        return this.http.get(
            GetBaseURL() + Endpoints.Dataset.DownloadRawDataset + '/' + encodeURIComponent(datasetUid),
            { observe: 'response', responseType: 'blob' }
        );
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
