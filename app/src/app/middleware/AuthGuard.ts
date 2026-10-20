import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    const token = authService.GetJwtTokenFromLocalStorage();

    if (token) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};