import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Endpoints, GetBaseURL } from '../endpoints/endpoint';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponseDto } from '../models/dto.model';
import { JwtTokenKey } from '../constants/commonConsts';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isLoggedInSubject = new BehaviorSubject<boolean>(this.HasToken());
    public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

    constructor(private http: HttpClient) { }

    Register(Payload: any): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Auth.Register, Payload);
    }

    Login(Payload: any): Observable<ApiResponseDto> {
        return this.http.post<ApiResponseDto>(GetBaseURL() + Endpoints.Auth.Login, Payload);
    }

    private HasToken(): boolean {
        return !!localStorage.getItem('jwt_token'); // Adjust key name to match your app
    }

    SaveJwtTokenIntoLocalStorage(JwtToken: string): void {
        this.DeleteJwtTokenFromLocalStorage();
        localStorage.setItem(JwtTokenKey, JwtToken);
        this.isLoggedInSubject.next(true);
    }

    GetJwtTokenFromLocalStorage(): string | null {
        return localStorage.getItem(JwtTokenKey);
    }

    DeleteJwtTokenFromLocalStorage(): void {
        let Token = this.GetJwtTokenFromLocalStorage();

        if (Token !== null && Token !== undefined) {
            localStorage.removeItem(JwtTokenKey);
        }
    }

    public Logout(): void {
        this.DeleteJwtTokenFromLocalStorage();
        this.isLoggedInSubject.next(false);
    }
}
