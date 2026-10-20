import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { JwtTokenKey, ResponseTypeColor } from '../constants/commonConsts';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CustomAlertComponent } from '../page-components-shared/custom-alert/custom-alert.component';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const dialog = inject(MatDialog);

  const token = localStorage.getItem(JwtTokenKey);

  let authReq = req.clone({
    withCredentials: true
  });

  if (token) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {

      if (error.status === 401) {
        dialog.open(CustomAlertComponent, { data: { text: "Session timed out. Please login again.", type: ResponseTypeColor.ERROR } });
        authService.DeleteJwtTokenFromLocalStorage();
        if (router.url !== '/login') {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};