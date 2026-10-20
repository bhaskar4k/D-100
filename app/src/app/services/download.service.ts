import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { Observable } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';

@Injectable({
    providedIn: 'root'
})
export class DownloadService {
    constructor(private http: HttpClient) { }

    DownloadSingleFile(FileId: string) {
        window.open(
            GetBaseURL() + Endpoints.Download.SingleFile + `/${FileId}`,
            "_blank"
        );
    }
}
