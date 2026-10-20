import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { ApiResponseDto } from '../../../models/dto.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
    ]),
  });

  MatProgressBar = false;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) { }

  OnSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.dialog.open(CustomAlertComponent, { data: { text: "All input fields are required.<br>Please fill all input fields.", type: ResponseTypeColor.ERROR } });
      return;
    }

    this.MatProgressBar = true;

    const Payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.Login(Payload).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === true && response.statusCode === 200) {
          this.authService.SaveJwtTokenIntoLocalStorage(response.data);
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
          this.router.navigate(['/dashboard']);
        } else {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }
      },
      error: (err: any) => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to login user.", type: ResponseTypeColor.ERROR } });
      }
    });
  }

  OnReset(): void {
    this.loginForm.reset();
  }
}
