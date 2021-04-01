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
import { forEach, filter } from 'lodash';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { PreferenceUtils } from './preferenceUtils.class';
import { PreferenceConstants } from './preferenceConstants.class';


export class SimplePreference implements Preference {
    private _topLevelPreferenceNodeshapeInstanceId: string;
    private _topLevelPreferenceNodeshapeInstance: any;
    private _formFieldPropertyShapes: any;
    private _formFieldProperties: Array<string>;
    private _values: Array<any> = [];
    private _json: any = {};
    private _requiredPropertyShape: any = {};

    constructor(preferenceJson: any, shapeDefinitions: any) {
        preferenceJson.values = [];
        this.json = preferenceJson;
        this.requiredPropertyShape = shapeDefinitions[this.requiredPropertyShapeId];  
        this.formFieldPropertyShapes = [this.requiredPropertyShape];
        this.formFieldProperties = [PreferenceConstants.HAS_DATA_VALUE];
    }

    public get type(): string {
        return this.json['@id'];
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

    public get formFieldPropertyShapes(): Array<any> {
        return this._formFieldPropertyShapes;
    }

    public set formFieldPropertyShapes(formFieldPropertyShapes: Array<any>) {
        this._formFieldPropertyShapes = formFieldPropertyShapes;
        const formFieldProperties = [];
        forEach(formFieldPropertyShapes, formField => {
            formFieldProperties.push(PreferenceUtils.getShaclPath(formField));
        });
        this._formFieldProperties = formFieldProperties;
    }

    public get requiredPropertyShape(): any {
        return this._requiredPropertyShape;
    }

    public set requiredPropertyShape(requiredPropertyShape: any) {
        this._requiredPropertyShape = requiredPropertyShape;
    }

    public get requiredPropertyShapeId(): string {
        return PreferenceUtils.getShaclProperty(this.json);
    }

    public get label(): string {
        return this.json['http://www.w3.org/ns/shacl#description'][0]['@value'];
    }

    public get json(): any {
        return this._json;
    }

    public set json(json: any) {
        this._json = json;
    }

    public get formFieldProperties(): Array<string> {
        return this._formFieldProperties;
    }

    public set formFieldProperties(formFieldProperties: Array<string>) {
        this._formFieldProperties = formFieldProperties;
    }

    public get values(): Array<any> {
        return this._values;
    }

    public set values(values: Array<any>) {
        this._values = values;
    }

    public get topLevelPreferenceNodeshapeInstance(): any {
        return this._topLevelPreferenceNodeshapeInstance;
    }

    public set topLevelPreferenceNodeshapeInstance(instance: any) {
        this._topLevelPreferenceNodeshapeInstance = instance;
    }

    public get topLevelPreferenceNodeshapeInstanceId(): string {
        return this._topLevelPreferenceNodeshapeInstanceId;
    }

    public set topLevelPreferenceNodeshapeInstanceId(resourceId: string) {
        this._topLevelPreferenceNodeshapeInstanceId = resourceId;
    }

    // Will take a literal value
    addValue(value: any): void {
        if (this.values.length) {
            this.values[0][PreferenceConstants.HAS_DATA_VALUE].push({'@value': value});
        } else {
            this.values = [
                {
                    'http://mobi.com/ontologies/preference#hasDataValue': [{'@value': value}]
                }
            ];
        }
    }

    addBlankValue(): void {
        this.addValue('');
    }

    blankValueExists(): boolean {
        if (!this.values.length) {
            return false;
        }
        let blankValExists = false;
        this.values[0][PreferenceConstants.HAS_DATA_VALUE].forEach(val => {
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

        this.values[0][PreferenceConstants.HAS_DATA_VALUE].forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.formFieldPropertyShapes.forEach(field => {
                fieldsTemplate[PreferenceUtils.getShaclPath(field)] = value['@value'];
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
        this.values[0][PreferenceConstants.HAS_DATA_VALUE] = [];
        form.get('formBlocks').value.forEach((value) => {
            this.values[0][PreferenceConstants.HAS_DATA_VALUE].push({'@value': String(value[PreferenceConstants.HAS_DATA_VALUE][PreferenceConstants.HAS_DATA_VALUE])});
        });
    }

    stripBlankValues(): void {
        if (!this.values.length) {
            return;
        }
        for (let i = this.values[0][PreferenceConstants.HAS_DATA_VALUE].length - 1; i >= 0; i--) {
            if (!this.values[0][PreferenceConstants.HAS_DATA_VALUE][i]['@value']) {
                this.values[0][PreferenceConstants.HAS_DATA_VALUE].splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.topLevelPreferenceNodeshapeInstanceId;
    }

    numValues(): number {
        return this.values[0][PreferenceConstants.HAS_DATA_VALUE].length;
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