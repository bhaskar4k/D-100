import { Routes } from '@angular/router';
import { LayoutBaseComponent } from './page-components/layout/layout-base/layout-base.component';
import { HomeComponent } from './page-components/home/home.component';
import { ErrorComponent } from './page-components/error/error.component';
import { RegisterComponent } from './page-components/auth-components/register/register.component';
import { LoginComponent } from './page-components/auth-components/login/login.component';
import { DashboardComponent } from './page-components/dashboard/dashboard.component';
import { FavouriteComponent } from './page-components/favourite/favourite.component';
import { ProfileSettingsComponent } from './page-components/settings/profile-settings/profile-settings.component';
import { BasicSettingsComponent } from './page-components/settings/basic-settings/basic-settings.component';
import { DeleteAccountComponent } from './page-components/settings/delete-account/delete-account.component';
import { ProfileComponent } from './page-components/profile/profile.component';
import { LogoutComponent } from './page-components/auth-components/logout/logout.component';
import { AuthGuard } from './middleware/AuthGuard';
import { ContentBaseComponent } from './page-components/content/content-base/content-base.component';
import { RecycleBinComponent } from './page-components/recycle-bin/recycle-bin.component';

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
          { path: 'content/:folder', component: ContentBaseComponent },

          { path: 'favourite', component: FavouriteComponent },

          { path: 'recycle-bin', component: RecycleBinComponent },

          { path: 'settings/profile-settings', component: ProfileSettingsComponent },
          { path: 'settings/basic-settings', component: BasicSettingsComponent },
          { path: 'settings/delete-account', component: DeleteAccountComponent },

          { path: 'profile', component: ProfileComponent },

          { path: 'logout', component: LogoutComponent }
        ]
      },

      // === CATCH-ALL ERROR ROUTE ===
      { path: '**', component: ErrorComponent }
    ]
  }
];
