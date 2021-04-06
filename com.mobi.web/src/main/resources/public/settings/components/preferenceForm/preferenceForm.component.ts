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

import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Preference } from '../../interfaces/preference.interface';
import { filter } from 'lodash';

@Component({
    selector: 'preference-form',
    templateUrl: './preferenceForm.component.html'
})

/**
 * @ngdoc component
 * @name settings.component:preferenceForm
 *
 * @description
 * `preferenceForm` is a component that contains a form allowing a user to change their preferences
 */
export class PreferenceFormComponent implements OnChanges {
    @Input() preference: Preference;
    @Output() updateEvent = new EventEmitter<Preference>();
    
    shaclShapes = {};
    maxBlocks = 1000;
    numValues = 0;
    
    form = new FormGroup({
        formBlocks: new FormArray([])
    });
        
    constructor() {}

    ngOnChanges(): void {
        if (this.preference.requiredPropertyShape['http://www.w3.org/ns/shacl#maxCount']) {
            this.maxBlocks = Number(this.preference.requiredPropertyShape['http://www.w3.org/ns/shacl#maxCount'][0]['@value']);
        }

        this.numValues = this.preference.numValues();

        // The point of this code is to create a lookup object to get the associated property shape for a given formFieldProperty.
        this.preference.formFieldProperties.forEach(formFieldProperty => {
            const shaclShape = filter(this.preference.formFieldPropertyShapes, formFieldPropertyShape => {
                return formFieldPropertyShape['http://www.w3.org/ns/shacl#path'][0]['@id'] === formFieldProperty;
            })[0];
            this.shaclShapes[formFieldProperty] = shaclShape;
        });

        this.form = this.preference.buildForm();
    }

    addFormBlock(): void {
        this.preference.updateWithFormValues(this.form);
        this.preference.addBlankValue();
        this.numValues = this.preference.numValues();
        this.form = this.preference.buildForm();
        this.form.markAsDirty(); // Enable the submit button
    }

    deleteFormBlock(index: number): void {
        this.formBlocks.removeAt(index); // Modify the angular form contents
        this.preference.updateWithFormValues(this.form); // modify the preference object to make it in sync with the form
        this.numValues = this.preference.numValues(); // update the number of form blocks present (to influence whether the plus button is shown)
        this.form = this.preference.buildForm(); // Re-build form based on preference object
        this.form.markAsDirty(); // Enable the submit button
    }

    get formBlocks(): FormArray {
        return this.form.get('formBlocks') as FormArray;
    }

    submitForm() {
        this.preference.updateWithFormValues(this.form);
        this.updateEvent.emit(this.preference);
    }
}