import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { AuthService } from '../../../services/auth.service';
import { ApiResponseDto } from '../../../models/dto.model';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3)
    ]),

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    phone: new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9]{10}$')
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ]),

    confirmPassword: new FormControl('', [
      Validators.required
    ])
  });

  MatProgressBar = false;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) { }

  OnSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.dialog.open(CustomAlertComponent, { data: { text: "All input fields are required.<br>Please fill all input fields.", type: ResponseTypeColor.ERROR } });
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.dialog.open(CustomAlertComponent, { data: { text: "Password and Confirm Password do not match.", type: ResponseTypeColor.ERROR } });
    }

    const Payload = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
      password: this.registerForm.value.password
    };

    this.MatProgressBar = true;

    this.authService.Register(Payload).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === true && response.statusCode === 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
          this.router.navigate(['/login']);
        } else {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }
      },
      error: (err: any) => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to register user.", type: ResponseTypeColor.ERROR } });
      }
    });
  }

  OnReset(): void {
    this.registerForm.reset();
  }
}
