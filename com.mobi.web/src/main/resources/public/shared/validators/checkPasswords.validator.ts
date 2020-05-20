import { FormGroup } from "@angular/forms";

export function checkPasswords(group: FormGroup) { // here we have the 'passwords' group
  let pass = group.get('password').value;
  let confirmPass = group.get('confirmPassword').value;

  return pass === confirmPass ? null : { notSame: true }     
}