import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Constants } from 'src/app/common/constants';
import { ParticipantModel } from 'src/app/common/model/participant.model';

@Component({
  selector: 'app-add-staff-member',
  templateUrl: './add-staff-member.component.html',
  styleUrls: ['./add-staff-member.component.css']
})
export class AddStaffMemberComponent implements OnInit {
  constants = Constants;

  form: FormGroup;

  firstNameControl: FormControl;
  lastNameControl: FormControl;
  displayNameControl: FormControl;
  emailControl: FormControl;
  phoneControl: FormControl;

  private staffMember: ParticipantModel;

  constructor(
    private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.staffMember = new ParticipantModel();
    this.initialiseFormFields();
  }

  get isEmailInvalid(): boolean {
    return this.emailControl.invalid && (this.emailControl.dirty || this.emailControl.touched);
  }
  
  saveStaffMember(): void {
    console.log(this.staffMember);
  }

  private initialiseFormFields() {
    this.firstNameControl = new FormControl(this.staffMember.first_name, {
        validators: [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)],
        updateOn: 'blur'
    });
    this.lastNameControl = new FormControl(this.staffMember.last_name, {
        validators: [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)],
        updateOn: 'blur'
    });
    this.displayNameControl = new FormControl(this.staffMember.display_name, {
        validators: [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)],
        updateOn: 'blur'
    });
    this.emailControl = new FormControl(this.staffMember.email, {
        validators: [Validators.required, Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)],
        updateOn: 'blur'
    });
    this.phoneControl = new FormControl(this.staffMember.phone, {
        validators: [Validators.pattern(Constants.PhonePattern)],
        updateOn: 'blur'
    });
    
    this.form = this.formBuilder.group({
      firstNameControl: this.firstNameControl,
      lastNameControl: this.lastNameControl,
      displayNameControl: this.displayNameControl,
      emailControl: this.emailControl,
      phoneControl: this.phoneControl,
    });
  }
}
