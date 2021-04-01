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
import { forEach, remove, filter } from 'lodash';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { PreferenceUtils } from './preferenceUtils.class';
import { PreferenceConstants } from './preferenceConstants.class';

export class ComplexPreference implements Preference {
    _topLevelPreferenceNodeshapeInstanceId: string;
    _topLevelPreferenceNodeshapeInstance: any;
    _formFieldPropertyShapes: any;
    _formFieldProperties: Array<string>;
    _values: Array<any> = [];
    _json: any = {};
    _requiredPropertyShape: any = {};
    _targetClass: any;
    _label: string;

    constructor(preferenceJson: any, shapeDefinitions: any) {
        preferenceJson.values = [];
        this.json = preferenceJson;
        this.requiredPropertyShape = shapeDefinitions[this.requiredPropertyShapeId];
        if (this.requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
            const attachedNode:unknown = shapeDefinitions[this.requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
            this.targetClass = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
            const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                return shapeDefinitions[finalProperty['@id']];
            });
            this.formFieldPropertyShapes = finalObjects;
        }
        const formFieldProperties = [];
        forEach(this.formFieldPropertyShapes, formField => {
            formFieldProperties.push(PreferenceUtils.getShaclPath(formField));
        });
        this.formFieldProperties = formFieldProperties;
    }

    public populate(userPreference): void {
        this.values = filter(userPreference, this.formFieldProperties[0]).sort(PreferenceUtils.userPrefComparator(this));

        if (!this.values.length) {
            this.addBlankValue();
        }

        // Find Node that corresponds to the top level instance of nodeshape of the given user preference 
        this.topLevelPreferenceNodeshapeInstance = filter(userPreference, entity => {
            return entity['@type'].includes('http://mobi.com/ontologies/preference#Preference');
        });

        if (this.topLevelPreferenceNodeshapeInstance.length) {
            this.topLevelPreferenceNodeshapeInstanceId = this.topLevelPreferenceNodeshapeInstance[0]['@id'];
        }
    }

    public get targetClass() {
        return this._targetClass;
    }

    public set targetClass(targetClass) {
        this._targetClass = targetClass;
    }

    public get formFieldPropertyShapes() {
        return this._formFieldPropertyShapes;
    }

    public set formFieldPropertyShapes(formFieldPropertyShapes: Array<any>) {
        this._formFieldPropertyShapes = formFieldPropertyShapes;
    }

    public get requiredPropertyShape() {
        return this._requiredPropertyShape;
    }

    public set requiredPropertyShape(requiredPropertyShape) {
        this._requiredPropertyShape = requiredPropertyShape;
    }

    public get requiredPropertyShapeId(): string {
        return PreferenceUtils.getShaclProperty(this.json);
    }

    public get type() {
        return this.json['@id'];
    }

    public get label() {
        return this.json['http://www.w3.org/ns/shacl#description'][0]['@value'];
    }

    public get json() {
        return this._json;
    }

    public set json(json) {
        this._json = json;
    }

    public get formFieldProperties(): Array<string> {
        return this._formFieldProperties;
    }

    public set formFieldProperties(formFieldProperties) {
        this._formFieldProperties = formFieldProperties;
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

    // Will take a non-literal value
    public addValue(value) {
        this.values.push(value);
    }

    public addBlankValue() {
        const valueObject = {};
        this.formFieldProperties.map(field => {
            const innerObj = {'@value': ''};
            valueObject[field] = [innerObj];
        });
        this.addValue(valueObject);
    }

    public blankValueExists(): boolean {
        for (let i = 0; i < this.values.length; i++) {
            let populatedFieldExists = false;
            this.formFieldProperties.forEach(field => {
                if (this.values[i][field][0]['@value']) {
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

        this.values.forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.formFieldPropertyShapes.forEach(field => {
                fieldsTemplate[PreferenceUtils.getShaclPath(field)] = value[PreferenceUtils.getShaclPath(field)][0]['@value'];
            });
            
            for (const control in fieldsTemplate) {
                const newFormGroup: FormGroup = new FormGroup({});
                newFormGroup.addControl(control, new FormControl(fieldsTemplate[control], Validators.required));
                fg.addControl(control, newFormGroup);
            }
            (theForm.get('formBlocks') as FormArray).push(fg); // Ask Robert how to write this line better
        });

        return theForm;
    }
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: Does not work when deleting items!!!
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    public updateWithFormValues(theForm: FormGroup) {
        theForm.get('formBlocks').value.forEach((value, index) => {
            Object.keys(value).forEach(field => {
                this.values[index][field] = [{'@value': value[field][field]}]; // This is weird that I'm doing [field][field] but I'm doing it because I had to add that formGroup in order to create a separate component.
            });
        });
    }

    stripBlankValues(): void {
        for (let i = this.values.length - 1; i >= 0; i--) {
            let populatedFieldExists = false;
            this.formFieldProperties.forEach(field => {
                if (this.values[i][field][0]['@value']) {
                    populatedFieldExists = true;
                }
            });
            if (!populatedFieldExists) {
                this.removeObjectValueFromObject(this.values[i]['@id'], this.topLevelPreferenceNodeshapeInstance[0]);
                this.values.splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.topLevelPreferenceNodeshapeInstanceId;
    }

    asJsonLD(): Array<any> {
        if (!this.topLevelPreferenceNodeshapeInstance.length) {
            this.topLevelPreferenceNodeshapeInstance = [PreferenceUtils.convertToJsonLd({}, [this.type, 'http://mobi.com/ontologies/preference#Setting', 'http://mobi.com/ontologies/preference#Preference'])];
            this.topLevelPreferenceNodeshapeInstanceId = this.topLevelPreferenceNodeshapeInstance[0]['@id'];
        }
        this.stripBlankValues();
        let jsonLD = [];
        this.values.map(val => {
            if (!PreferenceUtils.isJsonLd(val)) {
                PreferenceUtils.convertToJsonLd(val, [this.targetClass]);
            }
            this.addObjectValueToObject(val['@id'], this.topLevelPreferenceNodeshapeInstance[0]);
        });
        jsonLD.push(...this.topLevelPreferenceNodeshapeInstance, ...this.values);
        return jsonLD;
    }

    numValues(): number {
        return this.values.length;
    }

    addObjectValueToObject(newObjValId, obj) {
        if (!obj[PreferenceConstants.HAS_OBJECT_VALUE]) {
            obj[PreferenceConstants.HAS_OBJECT_VALUE] = [];
        }
        obj[PreferenceConstants.HAS_OBJECT_VALUE].push({
            '@id': newObjValId
        });
    }

    removeObjectValueFromObject(objValIdToRemove, obj): void { // I can probably remove one of the parameters since this will only ever be use with the topLevelPreferenceNodeShapeInstance
        remove(obj[PreferenceConstants.HAS_OBJECT_VALUE], { '@id': objValIdToRemove });
    }
}