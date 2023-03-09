import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";
import {includes} from "lodash";

export function datatypeValidator(datatypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control.value) {
            let validity = includes(datatypes, control.value);
            return validity ? null : { invalidDatatype: !validity }
        }
        return null;
    };
}