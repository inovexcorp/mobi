/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, Input, OnChanges } from '@angular/core';
import { Validators, ValidatorFn, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { SHACL, SHACL_FORM, XSD } from '../../../prefixes';
import { UtilService } from '../../services/util.service';

/**
 * @class shared.SettingFormFieldComponent
 *
 * A component that create form input(s) for a specific form field
 */
@Component({
    selector: 'setting-form-field',
    templateUrl: './settingFormField.component.html'
})
export class SettingFormFieldComponent implements OnChanges {
    @Input() fieldFormGroup: UntypedFormGroup;
    @Input() fieldShaclProperty: string;
    @Input() shaclShape: any;

    formType = '';
    options: Array<string> = [];
    validators: Array<ValidatorFn> = [];
    label = '';
        
    constructor(private util: UtilService) {}

    ngOnChanges(): void {
        this.label = this.util.getPropertyValue(this.shaclShape, SHACL + 'name');

        if (this.shaclShape[SHACL + 'pattern']) {
            const regex = this.util.getPropertyValue(this.shaclShape, SHACL + 'pattern');
            this.validators.push(Validators.pattern(regex));
        }

        switch (this.util.getPropertyId(this.shaclShape, SHACL_FORM + 'usesFormField')) {
            case SHACL_FORM + 'TextInput':
                this.formType = 'textInput';
                break;
            case SHACL_FORM + 'ToggleInput':
                this.formType = 'toggle';
                break;
            case '':
                this.util.createErrorToast('Form field type not configured');
                break;
            default:
                this.util.createErrorToast('Unsupported form field type');
        }
        
        switch (this.util.getPropertyId(this.shaclShape, SHACL + 'datatype')) {
            case XSD + 'boolean':
                this.convertFormValueToBoolean();
                break;
            case XSD + 'integer':
                this.validators.push(Validators.pattern('^[0-9]+$'));
                break;
            case XSD + 'string':
                break;
            case '':
                this.util.createErrorToast('Form field datatype not configured');
                break;
            default:
                this.util.createErrorToast('Unsupported form field datatype');
        }

        if (this.shaclShape[SHACL + 'minCount'] && Number(this.util.getPropertyValue(this.shaclShape, SHACL + 'minCount')) > 0) {
            this.validators.push(Validators.required);
        }

        this.fieldFormControl.setValidators(this.validators);
        this.fieldFormControl.updateValueAndValidity();
    }

    convertFormValueToBoolean(): void {
        this.fieldFormControl.setValue(this.fieldFormControl.value === 'true');
    }

    get fieldFormControl(): UntypedFormControl {
        return this.fieldFormGroup.get([this.fieldShaclProperty]) as UntypedFormControl;
    }
}
