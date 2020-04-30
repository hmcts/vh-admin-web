import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserDataService } from '../services/user-data.service';
import { Logger } from '../services/logger';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  form: FormGroup;
  failedSubmission: boolean;
  isValidEmail: boolean;
  showUpdateSuccess: boolean;
  popupMessage: string;
  saveSuccess: boolean;
  $subcription: Subscription;

  constructor(
    private fb: FormBuilder,
    private userDataService: UserDataService,
    private logger: Logger
  ) {
    this.showUpdateSuccess = false;
    this.isValidEmail = true;
  }

  ngOnInit() {
    this.saveSuccess = false;
    this.failedSubmission = false;
    this.form = this.fb.group({
      userName: ['']
    });
  }

  get userName() {
    return this.form.get('userName');
  }

  get userNameInvalid() {
    return (
      this.userName.invalid &&
      (this.userName.dirty || this.userName.touched || this.failedSubmission)
    );
  }

  userNameOnBlur() {
    const userNameText = this.userName.value;
    /* tslint:disable: max-line-length */
    const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    this.isValidEmail =
      userNameText &&
      userNameText.length > 0 &&
      userNameText.length < 256 &&
      pattern.test(userNameText.toLowerCase());
  }

  updateUser() {
    if (this.form.valid) {
      this.failedSubmission = false;
      this.saveSuccess = false;

      this.$subcription = this.userDataService
        .updateUser(this.userName.value)
        .subscribe(
          (data: void) => {
            this.popupMessage = 'User password has been changed';
            this.showUpdateSuccess = true;
            // this.logger.event('User\'s password has been changed.');
            this.saveSuccess = true;
          },
          (error) => {
            this.popupMessage =
              'User does not exist or does not belong to any groups';
            this.showUpdateSuccess = true;
            // this.logger.error('User does not exist.', error);
          }
        );
    } else {
      this.failedSubmission = true;
    }
  }

  okay(): void {
    this.showUpdateSuccess = false;
    if (this.saveSuccess) {
      this.form = this.fb.group({
        userName: ['', Validators.required]
      });
    }
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).focus();
  }

  ngOnDestroy() {
    if (this.$subcription) {
      this.$subcription.unsubscribe();
    }
  }
}
