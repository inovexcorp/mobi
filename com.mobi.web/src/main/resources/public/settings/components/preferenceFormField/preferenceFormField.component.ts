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
import { Validators, Validator, ValidatorFn } from '@angular/forms';

@Component({
    selector: 'preference-form-field',
    templateUrl: './preferenceFormField.component.html'
})

export class PreferenceFormFieldComponent implements OnChanges {
    @Input() formField;
    @Input() shaclValidation;
    formType;
    dataType;
    options;
    validators: Array<ValidatorFn> = [];
        
    constructor(@Inject('utilService') private util) {}

    ngOnChanges() {
        if (this.shaclValidation['http://www.w3.org/ns/shacl#pattern']) {
            const regex = this.shaclValidation['http://www.w3.org/ns/shacl#pattern'][0]['@value'];
            this.validators.push(Validators.pattern(regex));
        }
        switch(this.shaclValidation['http://mobi.com/ontologies/preference#usesFormField'][0]['@id']) {
            case 'http://mobi.com/ontologies/preference#TextInput':
              this.formType = 'text-input';
              break;
            case 'http://mobi.com/ontologies/preference#RadioInput':
              this.formType = 'radio';
              break;
            default:
              this.formType = 'Unknown Form Type!';
        }
        
        switch(this.shaclValidation['http://www.w3.org/ns/shacl#datatype'][0]['@id']) {
            case 'http://www.w3.org/2001/XMLSchema#boolean':
                this.dataType = 'boolean';
                this.options = ['true', 'false'];
                break;
            case 'http://www.w3.org/2001/XMLSchema#string':
                this.dataType = 'string';
                break;
            case 'http://www.w3.org/2001/XMLSchema#integer':
                this.dataType = 'integer';
                this.formField.value.get([this.formField.key]).setValidators(Validators.pattern("^[0-9]+$"));
            default:
                this.dataType = 'Unknown Data Type!';
        }

        if (this.shaclValidation['http://www.w3.org/ns/shacl#minCount'] && this.shaclValidation['http://www.w3.org/ns/shacl#minCount'][0]['@value'] > 0) {
            this.validators.push(Validators.required);
        }

        this.formField.value.get([this.formField.key]).setValidators(this.validators);
        this.formField.value.get([this.formField.key]).updateValueAndValidity();
    }
}