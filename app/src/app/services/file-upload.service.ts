import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { FileService } from './file.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  public IsUploading$ = new BehaviorSubject<boolean>(false);
  public UploadProgress$ = new BehaviorSubject<number>(0);
  public ActiveFileName$ = new BehaviorSubject<string>('');
  public UploadSpeed$ = new BehaviorSubject<string>('0 KB/s');
  public UploadEta$ = new BehaviorSubject<string>('Calculating...');

  private readonly CHUNK_SIZE = 1024 * 1024 * 10; // 10 MB chunks
  private readonly MAX_ATTEMPTS = 3;

  private uploadStartTime = 0;
  private totalFileSize = 0;

  constructor(
    private http: HttpClient,
    private fileService: FileService
  ) { }

  private InitiateUpload(payload: { fileName: string; fileSize: number; contentType: string }): Observable<ApiResponseDto> {
    return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Upload.Initiate, payload);
  }

  private UploadChunk(buffer: ArrayBuffer, chunkIndex: number, totalChunks: number, fileId: string): Observable<HttpEvent<any>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream',
      'X-Upload-Id': fileId,
      'X-Chunk-Index': chunkIndex.toString(),
      'X-Total-Chunks': totalChunks.toString()
    });

    return this.http.post(GetBaseURL() + Endpoints.Upload.Chunk, buffer, {
      headers,
      reportProgress: true,
      observe: 'events',
      responseType: 'text'
    });
  }

  async StartBackgroundUpload(file: File, FolderId: string): Promise<void> {
    this.IsUploading$.next(true);
    this.UploadProgress$.next(0);
    this.ActiveFileName$.next(file.name);
    this.UploadSpeed$.next('0 KB/s');
    this.UploadEta$.next('Calculating...');

    this.totalFileSize = file.size;
    this.uploadStartTime = Date.now(); // Baseline anchor timestamp

    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    try {
      const payload = {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        folderId: FolderId
      };

      const initiatedResponse = await firstValueFrom(this.InitiateUpload(payload));

      if (!initiatedResponse || initiatedResponse.success !== true || initiatedResponse.statusCode !== 200 || !initiatedResponse.data) {
        throw new Error(initiatedResponse?.message || "Failed to initiate server upload session.");
      }

      const fileId = initiatedResponse.data;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);

        const chunkBlob = file.slice(start, end);
        const arrayBuffer = await chunkBlob.arrayBuffer();

        let attempts = 0;
        let success = false;

        while (attempts < this.MAX_ATTEMPTS && !success) {
          try {
            attempts++;
            const uploadObservable = this.UploadChunk(arrayBuffer, chunkIndex, totalChunks, fileId);
            await this.TrackChunkProgress(uploadObservable, chunkIndex, totalChunks);
            success = true;
          }
          catch (error) {
            if (attempts >= this.MAX_ATTEMPTS) {
              throw new Error(`Chunk ${chunkIndex} permanently failed after ${this.MAX_ATTEMPTS} attempts.`);
            }
            await new Promise(res => setTimeout(res, 2000));
          }
        }
      }

      const UploadedFileMetaData = await firstValueFrom(this.fileService.GetFileInformationByFileGuid(fileId));

      if (UploadedFileMetaData.success !== true || UploadedFileMetaData.statusCode !== 200) {
        throw new Error(UploadedFileMetaData.message || "Failed to get uploaded file information.");
      }

      // Success Reset
      this.IsUploading$.next(false);
      this.UploadProgress$.next(100);
      this.ActiveFileName$.next('');
      this.UploadSpeed$.next('0 KB/s');
      this.UploadEta$.next('');

      return UploadedFileMetaData.data;
    }
    catch (error) {
      this.IsUploading$.next(false);
      this.UploadProgress$.next(0);
      this.ActiveFileName$.next('');
      this.UploadSpeed$.next('0 KB/s');
      this.UploadEta$.next('');
      throw error;
    }
  }

  private TrackChunkProgress(uploadObservable: Observable<any>, chunkIndex: number, totalChunks: number): Promise<any> {
    return new Promise((resolve, reject) => {
      uploadObservable.subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {

            // 1. Compute Progress Percentage
            const chunkProgress = event.loaded / event.total;
            const totalUploadedChunks = chunkIndex + chunkProgress;
            const absolutePercentage = Math.round((totalUploadedChunks / totalChunks) * 100);
            this.UploadProgress$.next(absolutePercentage);

            // 2. Real-Time Performance Math (Speed & ETA)
            const currentTime = Date.now();
            const totalElapsedTimeInSeconds = (currentTime - this.uploadStartTime) / 1000;

            if (totalElapsedTimeInSeconds > 0.5) {
              // Exact absolute bytes sent over the network across all combined chunks
              const absoluteBytesUploaded = (chunkIndex * this.CHUNK_SIZE) + event.loaded;
              const remainingBytes = this.totalFileSize - absoluteBytesUploaded;

              // Bytes Per Second
              const averageSpeedBytesPerSec = absoluteBytesUploaded / totalElapsedTimeInSeconds;

              // Format human-readable upload speeds
              if (averageSpeedBytesPerSec > 1024 * 1024) {
                this.UploadSpeed$.next((averageSpeedBytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s');
              } else {
                this.UploadSpeed$.next((averageSpeedBytesPerSec / 1024).toFixed(0) + ' KB/s');
              }

              // Compute remaining time allocation
              if (averageSpeedBytesPerSec > 0) {
                const totalSecondsRemaining = remainingBytes / averageSpeedBytesPerSec;
                this.UploadEta$.next(this.FormatTimeRemaining(totalSecondsRemaining));
              }
            }
          }
        },
        error: (err: any) => reject(err),
        complete: () => resolve(true)
      });
    });
  }

  private FormatTimeRemaining(totalSeconds: number): string {
    if (totalSeconds <= 0) return '00s';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes.toString().padStart(2, '0')}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);

    return parts.join(' ');
  }
}