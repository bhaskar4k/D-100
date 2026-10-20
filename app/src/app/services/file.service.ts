import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { Observable } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';
import { FileDeleteInputEntity, FileFavouriteInputEntity, FileRenameInputEntity } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private http: HttpClient) { }

  GetAllChildFilesByFolderId(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.File.GetAll + `/${FolderId}`);
  }

  GetAllFavouriteFiles(): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.File.GetAllFavourite);
  }

  GetAllFavouriteChildFilesByFolderId(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.File.GetAllFavourite + `/${FolderId}`);
  }

  GetFileInformationByFileGuid(FileGuid: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.File.Get + "/" + FileGuid);
  }

  RenameFile(Payload: FileRenameInputEntity): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.File.Rename, Payload);
  }

  DeleteFile(Payload: FileDeleteInputEntity): Observable<ApiResponseDto> {
    return this.http.delete<ApiResponseDto>(GetBaseURL() + Endpoints.File.Delete, { body: Payload });
  }

  FavouriteFile(Payload: FileFavouriteInputEntity): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.File.UpdateFavourite, Payload);
  }
}
