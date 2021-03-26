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
import { forEach, get } from 'lodash';
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
        preferenceJson.values = [];
        this.json = preferenceJson;
        this.requiredPropertyShape = preferenceDefinitions[this.requiredPropertyShapeId];  
        this.formFields = [this.requiredPropertyShape];
        this.formFieldStrings = ['http://mobi.com/ontologies/preference#hasDataValue'];
    }

    public get type() {
        return this.json['@id'];
    }

    public get formFields() {
        return this._formFields;
    }

    public set formFields(formFields: Array<any>) {
        this._formFields = formFields;
        const formFieldStrings = [];
        forEach(formFields, formField => {
            formFieldStrings.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
        });
        this._formFieldStrings = formFieldStrings;
    }

    public get requiredPropertyShape() {
        return this._requiredPropertyShape;
    }

    public set requiredPropertyShape(requiredPropertyShape) {
        this._requiredPropertyShape = requiredPropertyShape;
    }

    public get requiredPropertyShapeId(): string {
        return this.json['http://www.w3.org/ns/shacl#property'][0]['@id'];
    }

    public get label() {
        return this.json['http://www.w3.org/ns/shacl#description'][0]['@value'];
    }

    public get instantSubmit(): boolean {
        return Boolean(get(this.json, ['http://mobi.com/ontologies/preference#instantSubmit']['0']['@value'], false));
    }

    public get json() {
        return this._json;
    }

    public set json(json) {
        this._json = json;
    }

    public get formFieldStrings(): Array<string> {
        return this._formFieldStrings;
    }

    public set formFieldStrings(formFieldStrings) {
        this._formFieldStrings = formFieldStrings;
    }

    public get mainPropertyShapeId() {
        return this._mainPropertyShapeId;
    }

    public get values() {
        return this._values;
    }

    public set values(values) {
        this._values = values;
    }

    public get topLevelPreferenceNodeshapeInstance() {
        return this._topLevelPreferenceNodeshapeInstance;
    }

    public set topLevelPreferenceNodeshapeInstance(instance) {
        this._topLevelPreferenceNodeshapeInstance = instance;
    }

    public get topLevelPreferenceNodeshapeInstanceId() {
        return this._topLevelPreferenceNodeshapeInstanceId;
    }

    public set topLevelPreferenceNodeshapeInstanceId(resourceId) {
        this._topLevelPreferenceNodeshapeInstanceId = resourceId;
    }

    // Will take a literal value
    addValue(value: any): void {
        if (this.values.length) {
            this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': value});
        } else {
            this.values = [
                {
                    'http://mobi.com/ontologies/preference#hasDataValue': [{'@value': value}]
                }
            ];
        }
    }

    // Change name from addBlankForm to something else as it is only indirectly causing the creation of a blank form
    addBlankForm(): void {
        this.addValue('');
    }

    blankFormExists(): boolean {
        if (!this.values.length) {
            return false;
        }
        let blankValExists = false;
        this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(val => {
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

        this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.formFields.forEach(field => {
                fieldsTemplate[field['http://www.w3.org/ns/shacl#path'][0]['@id']] = value['@value'];
            });
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
        this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'] = [];
        form.get('formBlocks').value.forEach((value) => {
            this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': String(value['http://mobi.com/ontologies/preference#hasDataValue']['http://mobi.com/ontologies/preference#hasDataValue'])});
        });
    }

    stripBlankValues(): void {
        if (!this.values.length) {
            return;
        }
        for (let i = this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].length - 1; i >= 0; i--) {
            if (!this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'][i]['@value']) {
                this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.topLevelPreferenceNodeshapeInstanceId;
    }

    numValues(): number {
        return this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].length;
    }

    asJsonLD(): Array<any> {
        this.stripBlankValues();
        this.values.map(val => {
            if (!PreferenceUtils.isJsonLd(val)) {
                PreferenceUtils.convertToJsonLd(val, [this.type, 'http://mobi.com/ontologies/preference#Setting', 'http://mobi.com/ontologies/preference#Preference']);
            }
        });
        return this.values;
    }
}