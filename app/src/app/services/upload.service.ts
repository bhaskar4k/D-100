import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { ApiResponseDto } from '../models/dto.model';

export const SupportedUploadExtensions = ['.xlsx', '.xls', '.csv', '.parquet'];

const MaxChunkRetries = 3;
const SpeedSampleWindowMs = 5000;

export interface UploadProgress {
    uploadId: string;
    totalBytes: number;
    uploadedBytes: number;
    leftBytes: number;
    percent: number;
    speedBytesPerSecond: number;
    etaSeconds: number | null;
    completed: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UploadService {
    constructor(private http: HttpClient) { }

    IsSupportedFile(file: File): boolean {
        const name = file.name.toLowerCase();
        return SupportedUploadExtensions.some(ext => name.endsWith(ext));
    }

    // Uploads the file in chunks. Unsubscribing cancels the upload.
    Upload(file: File): Observable<UploadProgress> {
        return new Observable<UploadProgress>(subscriber => {
            let activeRequest: Subscription | undefined;
            let cancelled = false;

            const run = async () => {
                const initiate = await firstValueFrom(
                    this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Upload.Initiate, {
                        fileName: file.name,
                        fileSize: file.size
                    })
                );

                if (!initiate.success) {
                    throw new Error(initiate.message);
                }

                const { uploadId, chunkSize, totalChunks } = initiate.data as {
                    uploadId: string; chunkSize: number; totalChunks: number;
                };

                const samples: { time: number; bytes: number }[] = [];
                let completedBytes = 0;

                const emit = (currentChunkBytes: number, completed = false) => {
                    const uploadedBytes = completedBytes + currentChunkBytes;
                    const now = Date.now();

                    samples.push({ time: now, bytes: uploadedBytes });
                    while (samples.length > 1 && now - samples[0].time > SpeedSampleWindowMs) {
                        samples.shift();
                    }

                    const first = samples[0];
                    const elapsedSeconds = (now - first.time) / 1000;
                    const speed = elapsedSeconds > 0 ? Math.round((uploadedBytes - first.bytes) / elapsedSeconds) : 0;
                    const leftBytes = file.size - uploadedBytes;

                    subscriber.next({
                        uploadId,
                        totalBytes: file.size,
                        uploadedBytes,
                        leftBytes,
                        percent: (uploadedBytes / file.size) * 100,
                        speedBytesPerSecond: speed,
                        etaSeconds: speed > 0 ? leftBytes / speed : null,
                        completed
                    });
                };

                emit(0);

                for (let index = 0; index < totalChunks && !cancelled; index++) {
                    const start = index * chunkSize;
                    const blob = file.slice(start, Math.min(start + chunkSize, file.size));

                    for (let attempt = 1; ; attempt++) {
                        try {
                            await this.SendChunk(uploadId, index, blob, loaded => emit(loaded), request => activeRequest = request);
                            break;
                        } catch (error) {
                            if (cancelled || attempt >= MaxChunkRetries) {
                                throw error;
                            }
                        }
                    }

                    completedBytes += blob.size;
                    emit(0);
                }

                if (cancelled) {
                    return;
                }

                const complete = await firstValueFrom(
                    this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Upload.Complete, { uploadId })
                );

                if (!complete.success) {
                    throw new Error(complete.message);
                }

                emit(0, true);
                subscriber.complete();
            };

            run().catch(error => subscriber.error(error));

            return () => {
                cancelled = true;
                activeRequest?.unsubscribe();
            };
        });
    }

    private SendChunk(
        uploadId: string,
        index: number,
        blob: Blob,
        onProgress: (loadedBytes: number) => void,
        onRequest: (request: Subscription) => void
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const request = this.http.put<ApiResponseDto>(
                GetBaseURL() + Endpoints.Upload.Chunk + '/' + uploadId,
                blob,
                {
                    params: { index },
                    headers: { 'Content-Type': 'application/octet-stream' },
                    observe: 'events',
                    reportProgress: true
                }
            ).subscribe({
                next: event => {
                    if (event.type === HttpEventType.UploadProgress) {
                        onProgress(Math.min(event.loaded, blob.size));
                    } else if (event.type === HttpEventType.Response) {
                        if (event.body?.success) {
                            resolve();
                        } else {
                            reject(new Error(event.body?.message ?? 'Chunk upload failed.'));
                        }
                    }
                },
                error: reject
            });

            onRequest(request);
        });
    }
}
