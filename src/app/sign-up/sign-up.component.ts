import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  errorMessage: string;
  showSpinner: boolean;

  signUpForm: FormGroup;

  firstnameLatin: string;
  lastnameLatin: string;

  constructor(private fb: FormBuilder,
              private authService: AuthenticationService,
              private router: Router) {}

  ngOnInit() {
      /* load page only if the user is logged in */
      if (this.authService.getUserProp('email')) {

          this.createForm();
      } else {

          this.router.navigate(['/home']);
      }
  }

  createForm () {
      this.signUpForm = this.fb.group( {
          name: ['', Validators.required],
          surname: ['', Validators.required],
          nameLatin: '',
          surnameLatin: '',
          email: '',
          receiveEmails: [''],
          immediateEmails: ['']
      }, { validator: checkIfNull } );
      this.addUserInfoToForm();
  }

    addUserInfoToForm () {
      this.signUpForm.get('name').setValue(this.authService.getUserProp('firstname'));
      this.signUpForm.get('surname').setValue(this.authService.getUserProp('lastname'));
      this.signUpForm.get('nameLatin').setValue(this.authService.getUserProp('firstnameLatin'));
      this.signUpForm.get('surnameLatin').setValue(this.authService.getUserProp('lastnameLatin'));
      this.signUpForm.get('email').setValue(this.authService.getUserProp('email'));
      this.signUpForm.get('receiveEmails').setValue(this.authService.getUserProp('receiveEmails'));
      this.signUpForm.get('immediateEmails').setValue(this.authService.getUserProp('immediateEmails'));

      this.signUpForm.get('nameLatin').disable();
      this.signUpForm.get('surnameLatin').disable();
      this.signUpForm.get('email').disable();
      this.toggleImmediateEmailsDisable();
    }

    toggleImmediateEmailsDisable() {
      if (this.signUpForm.get('receiveEmails').value) {
          this.signUpForm.get('immediateEmails').enable();
      } else {
          this.signUpForm.get('immediateEmails').setValue(false);
          this.signUpForm.get('immediateEmails').disable();
      }
    }

    submitChanges() {
        if (this.signUpForm.valid) {
            this.updateUser();
        } else {
            this.errorMessage = 'Είναι απαραίτητο να συμπληρώσετε το όνομα και το επίθετό σας στα ελληνικά.';
            this.showSpinner = false;
            window.scrollTo(1, 1);
        }
    }

    updateUser() {
      this.errorMessage = '';
      this.showSpinner = true;

      this.authService.updateUserInfo( this.signUpForm.get('name').value,
                                       this.signUpForm.get('surname').value,
                                       (this.signUpForm.get('receiveEmails').value).toString(),
                                       (this.signUpForm.get('immediateEmails').value).toString() ).subscribe(
          user => console.log(`updateUser responded: ${JSON.stringify(user)}`),
          error => {
              this.errorMessage = 'Παρουσιάστηκε πρόβλημα κατά την αποθήκευση των αλλαγών';
              this.showSpinner = false;
          },
          () => {
              this.errorMessage = '';
              this.showSpinner = false;
              if ( sessionStorage.getItem('state.location') &&
                  (sessionStorage.getItem('state.location') !== '/sign-up') ) {
                  const state = sessionStorage.getItem('state.location');
                  sessionStorage.removeItem('state.location');
                  console.log('in sign-up returning to', state);
                  this.router.navigate([state]);
              } else {
                  this.router.navigate(['/home']);
              }
          }
      );
    }

}


export function checkIfNull(c: AbstractControl) {
    if ( (c.get('name').value === 'null') || (c.get('surname').value === 'null') ) {
        return 'invalid';
    }
    return null;
}
