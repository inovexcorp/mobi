/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { filter } from 'lodash';

import { SHACL } from '../../../prefixes';
import { Setting } from '../../models/setting.interface';

/**
 * @class shared.SettingFormComponent
 *
 * A component that contains a form allowing a user to change their settings
 */
@Component({
    selector: 'setting-form',
    templateUrl: './settingForm.component.html'
})
export class SettingFormComponent implements OnChanges {
    @Input() setting: Setting;
    @Output() updateEvent = new EventEmitter<Setting>();
    
    shaclShapes = {};
    maxBlocks = 1000;
    numValues = 0;
    
    form = new FormGroup({
        formBlocks: new FormArray([])
    });
        
    constructor(@Inject('utilService') private util) {}

    ngOnChanges(): void {
        if (this.setting.requiredPropertyShape[SHACL + 'maxCount']) {
            this.maxBlocks = Number(this.util.getPropertyValue(this.setting.requiredPropertyShape, SHACL + 'maxCount'));
        }

        this.numValues = this.setting.numValues();

        // Create a lookup object to get the associated property shape for a given formFieldProperty.
        this.setting.formFieldProperties.forEach(formFieldProperty => {
            const shaclShape = filter(this.setting.formFieldPropertyShapes, formFieldPropertyShape => {
                return this.util.getPropertyId(formFieldPropertyShape, SHACL + 'path') === formFieldProperty;
            })[0];
            this.shaclShapes[formFieldProperty] = shaclShape;
        });

        this.form = this.setting.buildForm();
    }

    addFormBlock(): void {
        this.setting.updateWithFormValues(this.form);
        this.setting.addBlankValue();
        this.numValues = this.setting.numValues();
        this.form = this.setting.buildForm();
        this.form.markAsDirty(); // Enable the submit button
    }

    deleteFormBlock(index: number): void {
        this.formBlocks.removeAt(index); // Modify the angular form contents
        this.setting.updateWithFormValues(this.form); // modify the setting object to make it in sync with the form
        this.numValues = this.setting.numValues(); // update the number of form blocks present (to influence whether the plus button is shown)
        this.form = this.setting.buildForm(); // Re-build form based on setting object
        this.form.markAsDirty(); // Enable the submit button
    }

    get formBlocks(): FormArray {
        return this.form.get('formBlocks') as FormArray;
    }

    formBlockKeys(n: number): Array<string> {
        const formBlock: FormGroup = (this.form.get(['formBlocks', String(n)]) as FormGroup);
        return Object.keys(formBlock.controls);
    }

    submitForm(): void {
        this.setting.updateWithFormValues(this.form);
        this.updateEvent.emit(this.setting);
    }
}
