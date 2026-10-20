import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { Observable } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';
import { FolderCreateInputEntity, FolderDeleteInputEntity, FolderFavouriteInputEntity, FolderRenameInputEntity } from '../models/folder.model';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  constructor(private http: HttpClient) { }

  ValidateFolderAccess(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.ValidateFolderAccess + `/${FolderId}`);
  }

  CreateFolder(Payload: FolderCreateInputEntity): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.Create, Payload);
  }

  GetAllChildFoldersByFolderId(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.GetAll + `/${FolderId}`);
  }

  GetAllFavouriteChildFoldersByFolderId(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.GetAllFavourite + `/${FolderId}`);
  }

  GetSubfolderAndFileCount(FolderId: string): Observable<ApiResponseDto> {
    return this.http.get<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.GetSubfolderAndFileCount + `/${FolderId}`);
  }

  RenameFolder(Payload: FolderRenameInputEntity): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.Rename, Payload);
  }

  DeleteFolder(Payload: FolderDeleteInputEntity): Observable<ApiResponseDto> {
    return this.http.delete<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.Delete, { body: Payload });
  }

  FavouriteFolder(Payload: FolderFavouriteInputEntity): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Folder.UpdateFavourite, Payload);
  }
}
