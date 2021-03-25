/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import { Component, Input, EventEmitter, Output, OnChanges, Inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Preference } from '../../interfaces/preference.interface';
import { filter } from 'lodash';

@Component({
    selector: 'preference-form',
    templateUrl: './preferenceForm.component.html'
})

export class PreferenceFormComponent implements OnChanges {
    @Input() preference: Preference;
    @Output() updateEvent = new EventEmitter<{preference:unknown}>();
    shaclFieldValidation = {};
    maxBlocks = 1000;
    numValues = 0;
    
    form = new FormGroup({
        formBlocks: new FormArray([])
    });
        
    constructor(@Inject('utilService') private util) {}

    ngOnChanges() {
        if (this.preference.requiredPropertyShape['http://www.w3.org/ns/shacl#maxCount']) {
            this.maxBlocks = this.preference.requiredPropertyShape['http://www.w3.org/ns/shacl#maxCount'][0]['@value'];
        }

        this.numValues = this.preference.numValues();

        // Temporary code. Put this somewhere else eventually
        this.preference.formFieldStrings.forEach(formFieldString => {
            const shaclValidator = filter(this.preference.formFields, formField => {
                return formField['http://www.w3.org/ns/shacl#path'][0]['@id'] === formFieldString;
            })[0];
            this.shaclFieldValidation[formFieldString] = shaclValidator;
        });

        this.formBlocks.setValue([]);
        this.form = this.preference.buildForm();
    }

    addFormBlock() {
        this.preference.updateWithFormValues(this.form);
        this.preference.addBlankForm();
        this.numValues = this.preference.numValues();
        this.form = this.preference.buildForm();
    }

    deleteFormBlock(index: number) {
        this.formBlocks.removeAt(index);
        this.preference.updateWithFormValues(this.form);
        this.numValues = this.preference.numValues();
        this.form = this.preference.buildForm();
    }

    get formBlocks(): FormArray {
        return this.form.get('formBlocks') as FormArray;
    }

    onSubmit() {
        this.preference.updateWithFormValues(this.form);
        this.updateEvent.emit({preference: this.preference});
    }
}