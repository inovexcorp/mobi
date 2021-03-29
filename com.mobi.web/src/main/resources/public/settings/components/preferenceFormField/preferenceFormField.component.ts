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
import { Validators, ValidatorFn } from '@angular/forms';
import { get } from 'lodash';

@Component({
    selector: 'preference-form-field',
    templateUrl: './preferenceFormField.component.html'
})

export class PreferenceFormFieldComponent implements OnChanges {
    @Input() formField;
    @Input() shaclShape;
    formType = '';
    options = [];
    validators: Array<ValidatorFn> = [];
    label: string = '';
        
    constructor(@Inject('utilService') private util) {}

    ngOnChanges() {
        this.label = get(this.shaclShape, ['http://www.w3.org/ns/shacl#name', '0', '@value'], '');

        if (this.shaclShape['http://www.w3.org/ns/shacl#pattern']) {
            const regex = this.shaclShape['http://www.w3.org/ns/shacl#pattern'][0]['@value'];
            this.validators.push(Validators.pattern(regex));
        }

        switch(get(this.shaclShape, ['http://mobi.com/ontologies/preference#usesFormField', '0', '@id'], '')) {
            case 'http://mobi.com/ontologies/preference#TextInput':
                this.formType = 'textInput';
                break;
            case 'http://mobi.com/ontologies/preference#RadioInput':
                this.formType = 'radio';
                break;
            case 'http://mobi.com/ontologies/preference#ToggleInput':
                this.formType = 'toggle';
                break;
            case '':
                this.util.createErrorToast('Form field type not configured');
                break;
            default:
                this.util.createErrorToast('Unsupported form field type')
        }
        
        switch(get(this.shaclShape, ['http://www.w3.org/ns/shacl#datatype', '0', '@id'], '')) {
            case 'http://www.w3.org/2001/XMLSchema#boolean':
                if (this.formType === 'radio') {
                    this.options = ['true', 'false'];
                } else if (this.formType === 'toggle') {
                    this.convertFormValueToBoolean();
                }
                break;
            case 'http://www.w3.org/2001/XMLSchema#integer':
                this.formField.value.get([this.formField.key]).setValidators(Validators.pattern("^[0-9]+$"));
                break;
            case 'http://www.w3.org/2001/XMLSchema#string':
                break;
            case '':
                this.util.createErrorToast('Form field datatype not configured');
            default:
                this.util.createErrorToast('Unsupported form field datatype')
        }

        if (this.shaclShape['http://www.w3.org/ns/shacl#minCount'] && this.shaclShape['http://www.w3.org/ns/shacl#minCount'][0]['@value'] > 0) {
            this.validators.push(Validators.required);
        }

        this.formField.value.get([this.formField.key]).setValidators(this.validators);
        this.formField.value.get([this.formField.key]).updateValueAndValidity();
    }

    convertFormValueToBoolean() {
        this.formField.value.get([this.formField.key]).setValue(this.formField.value.get([this.formField.key]).value === 'true');
    }
}