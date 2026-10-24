import { Routes } from '@angular/router';
import { LayoutBaseComponent } from './page-components/layout/layout-base/layout-base.component';
import { HomeComponent } from './page-components/home/home.component';
import { ErrorComponent } from './page-components/error/error.component';
import { RegisterComponent } from './page-components/auth/register/register.component';
import { LoginComponent } from './page-components/auth/login/login.component';
import { DashboardComponent } from './page-components/dashboard/dashboard.component';
import { LogoutComponent } from './page-components/auth/logout/logout.component';
import { UploadComponent } from './page-components/upload/upload.component';
import { AuthGuard } from './middleware/AuthGuard';
import { ViewDatasetGridComponent } from './page-components/manage-dataset/view-dataset-grid/view-dataset-grid.component';
import { ViewDatasetInfoComponent } from './page-components/manage-dataset/view-dataset-info/view-dataset-info.component';
import { ViewDeletedDatasetGridComponent } from './page-components/view-deleted-dataset-grid/view-deleted-dataset-grid.component';

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
          { path: 'upload', component: UploadComponent },
          { path: 'datasets', redirectTo: 'datasets/active', pathMatch: 'full' },
          { path: 'datasets/active', component: ViewDatasetGridComponent },
          { path: 'datasets/deleted', component: ViewDeletedDatasetGridComponent },
          { path: 'datasets/view', component: ViewDatasetInfoComponent },
          { path: 'logout', component: LogoutComponent }
        ]
      },

      // === CATCH-ALL ERROR ROUTE ===
      { path: '**', component: ErrorComponent }
    ]
  }
];
