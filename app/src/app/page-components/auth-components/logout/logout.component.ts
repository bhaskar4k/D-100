import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {
  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.dialog.open(CustomAlertComponent, { data: { text: "Logging out...", type: ResponseTypeColor.INFO } });
    this.authService.Logout();
    this.router.navigate(['/login']);
  }
}
