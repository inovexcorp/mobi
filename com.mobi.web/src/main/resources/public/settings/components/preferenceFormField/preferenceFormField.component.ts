/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Input, OnChanges, Inject } from '@angular/core';
import { Validators, ValidatorFn, FormControl, FormGroup } from '@angular/forms';

/**
 * @ngdoc component
 * @name settings.component:preferenceFormField
 * @requires shared.service.utilService
 * @requires shared.service.prefixes
 *
 * @description
 * `preferenceFormField` is a component that create form input(s) for a specific form field
 */
@Component({
    selector: 'preference-form-field',
    templateUrl: './preferenceFormField.component.html'
})
export class PreferenceFormFieldComponent implements OnChanges {
    @Input() fieldFormGroup: FormGroup;
    @Input() fieldShaclProperty: string;
    @Input() shaclShape: any;

    formType = '';
    options: Array<string> = [];
    validators: Array<ValidatorFn> = [];
    label = '';
        
    constructor(@Inject('utilService') private util, @Inject('prefixes') private prefixes) {}

    ngOnChanges(): void {
        this.label = this.util.getPropertyValue(this.shaclShape, this.prefixes.shacl + 'name');

        if (this.shaclShape[this.prefixes.shacl + 'pattern']) {
            const regex = this.util.getPropertyValue(this.shaclShape, this.prefixes.shacl + 'pattern');
            this.validators.push(Validators.pattern(regex));
        }

        switch (this.util.getPropertyId(this.shaclShape, this.prefixes.preference + 'usesFormField')) {
            case this.prefixes.preference + 'TextInput':
                this.formType = 'textInput';
                break;
            case this.prefixes.preference + 'ToggleInput':
                this.formType = 'toggle';
                break;
            case '':
                this.util.createErrorToast('Form field type not configured');
                break;
            default:
                this.util.createErrorToast('Unsupported form field type');
        }
        
        switch (this.util.getPropertyId(this.shaclShape, this.prefixes.shacl + 'datatype')) {
            case this.prefixes.xsd + 'boolean':
                this.convertFormValueToBoolean();
                break;
            case this.prefixes.xsd + 'integer':
                this.validators.push(Validators.pattern('^[0-9]+$'));
                break;
            case this.prefixes.xsd + 'string':
                break;
            case '':
                this.util.createErrorToast('Form field datatype not configured');
                break;
            default:
                this.util.createErrorToast('Unsupported form field datatype');
        }

        if (this.shaclShape[this.prefixes.shacl + 'minCount'] && Number(this.util.getPropertyValue(this.shaclShape, this.prefixes.shacl + 'minCount')) > 0) {
            this.validators.push(Validators.required);
        }

        this.fieldFormControl.setValidators(this.validators);
        this.fieldFormControl.updateValueAndValidity();
    }

    convertFormValueToBoolean(): void {
        this.fieldFormControl.setValue(this.fieldFormControl.value === 'true');
    }

    get fieldFormControl(): FormControl {
        return this.fieldFormGroup.get([this.fieldShaclProperty]) as FormControl;
    }
}