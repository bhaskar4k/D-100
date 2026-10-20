import { Routes } from '@angular/router';
import { LayoutBaseComponent } from './page-components/layout/layout-base/layout-base.component';
import { HomeComponent } from './page-components/home/home.component';
import { ErrorComponent } from './page-components/error/error.component';
import { RegisterComponent } from './page-components/auth/register/register.component';
import { LoginComponent } from './page-components/auth/login/login.component';
import { DashboardComponent } from './page-components/dashboard/dashboard.component';
import { LogoutComponent } from './page-components/auth/logout/logout.component';
import { AuthGuard } from './middleware/AuthGuard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBaseComponent,
    children: [
      // === PUBLIC ROUTES ===
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'dashboard', component: DashboardComponent },

      { path: 'register', component: RegisterComponent },
      { path: 'login', component: LoginComponent },

      // === PROTECTED ROUTES (Grouped under the Guard) ===
      {
        path: '',
        canActivate: [AuthGuard],
        children: [
          { path: 'content', redirectTo: 'content/root', pathMatch: 'full' },


          { path: 'logout', component: LogoutComponent }
        ]
      },

      // === CATCH-ALL ERROR ROUTE ===
      { path: '**', component: ErrorComponent }
    ]
  }
];
