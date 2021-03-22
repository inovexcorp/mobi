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
import { Preference } from '../interfaces/preference.interface';
import { forEach } from 'lodash';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { PreferenceUtils } from './preferenceUtils.class';

export class SimplePreference implements Preference {
    _topLevelPreferenceNodeshapeInstanceId: string;
    _topLevelPreferenceNodeshapeInstance: any;
    _mainPropertyShapeId: any;
    _formFields: any;
    _formFieldStrings: Array<string>;
    _values: Array<any> = [];
    _json: any = {};
    _requiredPropertyShape: any = {};

    constructor(preferenceJson: any, preferenceDefinitions: any) {
        // this._mainPropertyShapeId = preference['http://www.w3.org/ns/shacl#property'][0]['@id'];
        preferenceJson.values = [];
        this.Json = preferenceJson;
        this.RequiredPropertyShape = preferenceDefinitions[this.RequiredPropertyShapeId];  
        this.FormFields = [this.RequiredPropertyShape];
        this.FormFieldStrings = ['http://mobi.com/ontologies/preference#hasDataValue'];
    }

    public get type() {
        return this.Json['@id'];
    }

    public get FormFields() {
        return this._formFields;
    }

    public set FormFields(formFields: Array<any>) {
        this._formFields = formFields;
        const formFieldStrings = [];
        forEach(formFields, formField => {
            formFieldStrings.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
        });
        this._formFieldStrings = formFieldStrings;
    }

    public get RequiredPropertyShape() {
        return this._requiredPropertyShape;
    }

    public set RequiredPropertyShape(requiredPropertyShape) {
        this._requiredPropertyShape = requiredPropertyShape;
    }

    public get RequiredPropertyShapeId(): string {
        return this.Json['http://www.w3.org/ns/shacl#property'][0]['@id'];
    }

    public initialize(preferenceDefinitions): void {
        const requiredPropertyShape = preferenceDefinitions[this.RequiredPropertyShapeId];  
        this.FormFields = [requiredPropertyShape];
        this.FormFieldStrings = ['http://mobi.com/ontologies/preference#hasDataValue'];
    }

    public get Json() {
        return this._json;
    }

    public set Json(json) {
        this._json = json;
    }

    public get FormFieldStrings(): Array<string> {
        return this._formFieldStrings;
    }

    public set FormFieldStrings(formFieldStrings) {
        this._formFieldStrings = formFieldStrings;
    }

    public get MainPropertyShapeId() {
        return this._mainPropertyShapeId;
    }

    public get Values() {
        return this._values;
    }

    public set Values(values) {
        this._values = values;
    }

    public get TopLevelPreferenceNodeshapeInstance() {
        return this._topLevelPreferenceNodeshapeInstance;
    }

    public set TopLevelPreferenceNodeshapeInstance(instance) {
        this._topLevelPreferenceNodeshapeInstance = instance;
    }

    public get TopLevelPreferenceNodeshapeInstanceId() {
        return this._topLevelPreferenceNodeshapeInstanceId;
    }

    public set TopLevelPreferenceNodeshapeInstanceId(resourceId) {
        this._topLevelPreferenceNodeshapeInstanceId = resourceId;
    }

    // Will take a literal value
    addValue(value: any): void {
        if (this.Values.length) {
            this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': value});
        } else {
            this.Values = [
                {
                    'http://mobi.com/ontologies/preference#hasDataValue': [{'@value': value}]
                }
            ];
        }
    }

    // Change name from addBlankForm to something else as it is only indirectly causing the creation of a blank form
    addBlankForm(): void {
        // if (!this.blankFormExists()) { // I may remove this conditional at some point since submitting a form strips off the blank values, and perhaps the user may want to enter multiple values at once without having to submit first
            this.addValue('');
        // }
    }

    blankFormExists(): boolean {
        if (!this.Values.length) {
            return false;
        }
        let blankValExists = false;
        this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(val => {
            if (!val['@value']) {
                blankValExists = true;
            }
        });
        return blankValExists;
    }

    public buildForm(): FormGroup {
        let form = new FormGroup({
            formBlocks: new FormArray([])
        });

        this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.FormFields.forEach(field => {
                fieldsTemplate[field['http://www.w3.org/ns/shacl#path'][0]['@id']] = value['@value'];
            });
            // for (const control in fieldsTemplate) {
            //     for (const control in fieldsTemplate) {
            //         form: formGroup
            //             formBlocks: formArray
            //                 0: 
            //                     Namespace: FormGroup
            //                         innerGroup: FormControl
            //                     Prefix: FormGroup
            //                         innerGroup: FormControl
            //         fg[control] = new FormGroup({
            //             innerControl: new FormControl(fieldsTemplate[control])
            //         });
            //     }
            //     fg[control] = new FormControl(fieldsTemplate[control]);
            // }
            for (const control in fieldsTemplate) {
                const newFormGroup: FormGroup = new FormGroup({});
                newFormGroup.addControl(control, new FormControl(fieldsTemplate[control], Validators.required));
                fg.addControl(control, newFormGroup);
            }
            (form.get('formBlocks') as FormArray).push(fg); // Ask Robert how to write this line better
        });

        return form;
    }

    public updateWithFormValues(form: FormGroup) {
        this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'] = [];
        form.get('formBlocks').value.forEach((value) => {
            this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': value['http://mobi.com/ontologies/preference#hasDataValue']['http://mobi.com/ontologies/preference#hasDataValue']});
        });
    }

    stripBlankValues(): void {
        if (!this.Values.length) {
            return;
        }
        for (let i = this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].length - 1; i >= 0; i--) {
            if (!this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'][i]['@value']) {
                this.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.TopLevelPreferenceNodeshapeInstanceId;
    }

    asJsonLD(): Array<any> {
        this.stripBlankValues();
        this.Values.map(val => {
            if (!PreferenceUtils.isJsonLd(val)) {
                PreferenceUtils.convertToJsonLd(val, [this.type, 'http://mobi.com/ontologies/preference#Setting', 'http://mobi.com/ontologies/preference#Preference']);
            }
        });
        return this.Values;
    }
}