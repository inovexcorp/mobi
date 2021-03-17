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
import { forEach, remove } from 'lodash';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { PreferenceUtils } from './preferenceUtils.class';
import { v4 as uuid } from 'uuid';

export class ComplexPreference implements Preference {
    _topLevelPreferenceNodeshapeInstanceId: string;
    _topLevelPreferenceNodeshapeInstance: any;
    _mainPropertyShapeId: any;
    _formFields: any;
    _formFieldStrings: Array<string>;
    _values: Array<any> = [];
    _json: any = {};
    _requiredPropertyShape: any = {};
    _targetClass: any;

    constructor(preferenceJson: any, preferenceDefinitions: any) {
        // this._mainPropertyShapeId = preference['http://www.w3.org/ns/shacl#property'][0]['@id'];
        preferenceJson.values = [];
        this.Json = preferenceJson;
        const requiredPropertyShape = preferenceDefinitions[this.RequiredPropertyShapeId];
        // preference.RequiredPropertyShape = this.preferenceDefinitions[preference.RequiredPropertyShapeId];
        if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
            const attachedNode:unknown = preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
            // this.Json['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
            this.TargetClass = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
            const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                return preferenceDefinitions[finalProperty['@id']];
            });
            this.FormFields = finalObjects;
        }
        const formFieldStrings = [];
        forEach(this.FormFields, formField => {
            formFieldStrings.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
        });
        this.FormFieldStrings = formFieldStrings;
    }

    public get TargetClass() {
        return this._targetClass;
    }

    public set TargetClass(targetClass) {
        this._targetClass = targetClass;
    }

    public get FormFields() {
        return this._formFields;
    }

    public set FormFields(formFields: Array<any>) {
        this._formFields = formFields;
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
        const requiredPropertyShape = preferenceDefinitions[this.Json['http://www.w3.org/ns/shacl#property'][0]['@id']];
        // preference.RequiredPropertyShape = this.preferenceDefinitions[preference.RequiredPropertyShapeId];
        if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
            const attachedNode:unknown = preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
            this.Json['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
            // preference.TargetClass = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
            const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                return preferenceDefinitions[finalProperty['@id']];
            });
            this.FormFields = finalObjects;
        }
        const formFieldStrings = [];
        forEach(this.FormFields, formField => {
            formFieldStrings.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
        });
        this.FormFieldStrings = formFieldStrings;
    }

    public get type() {
        return this.Json['@id'];
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

    // Will take a non-literal value
    public addValue(value) {
        this.Values.push(value);
    }

    // Change name from addBlankForm to something else as it is only indirectly causing the creation of a blank form
    public addBlankForm() {
        // if (!this.blankFormExists()) { // I may remove this conditional at some point since submitting a form strips off the blank values, and perhaps the user may want to enter multiple values at once without having to submit first
            const valueObject = {};
            this.FormFieldStrings.map(field => {
                const innerObj = {'@value': ''};
                valueObject[field] = [innerObj];
            });
            this.addValue(valueObject);
        // }
    }

    public blankFormExists(): boolean {
        for (let i = 0; i < this.Values.length; i++) {
            let populatedFieldExists = false;
            this.FormFieldStrings.forEach(field => {
                if (this.Values[i][field][0]['@value']) {
                    populatedFieldExists = true;
                }
            });
            if (!populatedFieldExists) {
                return true;
            }
        }
        return false;
    }

    

    public buildForm(): FormGroup {
        let theForm = new FormGroup({
            formBlocks: new FormArray([])
        });

        this.Values.forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.FormFields.forEach(field => {
                fieldsTemplate[field['http://www.w3.org/ns/shacl#path'][0]['@id']] = value[field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'];
            });
            
            for (const control in fieldsTemplate) {
                const newFormGroup: FormGroup = new FormGroup({});
                newFormGroup.addControl(control, new FormControl(fieldsTemplate[control]));
                fg.addControl(control, newFormGroup);
            }
            (theForm.get('formBlocks') as FormArray).push(fg); // Ask Robert how to write this line better
        });

        return theForm;
    }

    public updateWithFormValues(theForm: FormGroup) {
        theForm.get('formBlocks').value.forEach((value, index) => {
            Object.keys(value).forEach(field => {
                this.Values[index][field] = [{'@value': value[field][field]}]; // This is weird that I'm doing [field][field] but I'm doing it because I had to add that formGroup in order to create a separate component.
            });
        });
    }

    stripBlankValues(): void {
        for (let i = this.Values.length - 1; i >= 0; i--) {
            let populatedFieldExists = false;
            this.FormFieldStrings.forEach(field => {
                if (this.Values[i][field][0]['@value']) {
                    populatedFieldExists = true;
                }
            });
            if (!populatedFieldExists) {
                this.removeObjectValueFromObject(this.Values[i]['@id'], this.TopLevelPreferenceNodeshapeInstance[0]);
                this.Values.splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.TopLevelPreferenceNodeshapeInstanceId;
    }

    asJsonLD(): Array<any> {
        if (!this.TopLevelPreferenceNodeshapeInstance) {
            this.TopLevelPreferenceNodeshapeInstance = [PreferenceUtils.convertToJsonLd({}, [this.type, 'http://mobi.com/ontologies/preference#Setting', 'http://mobi.com/ontologies/preference#Preference'])];
        }
        this.stripBlankValues();
        let requestBody = [];
        this.Values.map(val => {
            if (!PreferenceUtils.isJsonLd(val)) {
                PreferenceUtils.convertToJsonLd(val, [this.TargetClass]);
            }
            this.addObjectValueToObject(val['@id'], this.TopLevelPreferenceNodeshapeInstance[0]); // This might break stuff!!!
        });
        requestBody.push(...this.TopLevelPreferenceNodeshapeInstance, ...this.Values);
        return requestBody;
    }

    // buildUserPreferenceJson() {
    //     const userPreferenceJson = [];
    //     const newPreference = {
    //         '@id': 'http://mobi.com/preference#' + uuid.v4(),
    //         '@type': [
    //             this.type(),
    //             'http://mobi.com/ontologies/preference#Preference',
    //             'http://www.w3.org/2002/07/owl#Thing',
    //             'http://mobi.com/ontologies/preference#Setting'
    //         ]
    //     };
    //     this.Values.map(val => {
    //         if (!PreferenceUtils.isJsonLd(val)) {
    //             PreferenceUtils.convertToJsonLd(val, [this.TargetClass]);
    //         }
    //         this.addObjectValueToObject(val['@id'], newPreference);
    //     });
    //     userPreferenceJson.push(...this.Values);
    //     // NOT FINISHED YET!!!
    //     userPreferenceJson.push(newPreference);
    //     return userPreferenceJson;
    // }

    addObjectValueToObject(newObjValId, obj) {
        if (!obj['http://mobi.com/ontologies/preference#hasObjectValue']) {
            obj['http://mobi.com/ontologies/preference#hasObjectValue'] = [];
        }
        obj['http://mobi.com/ontologies/preference#hasObjectValue'].push({
            '@id': newObjValId
        });
    }

    removeObjectValueFromObject(objValIdToRemove, obj): void { // I can probably remove one of the parameters since this will only ever be use with the topLevelPreferenceNodeShapeInstance
        remove(obj['http://mobi.com/ontologies/preference#hasObjectValue'], { '@id': objValIdToRemove });
    }
}