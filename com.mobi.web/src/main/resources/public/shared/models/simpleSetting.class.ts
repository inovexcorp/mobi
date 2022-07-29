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
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

import { forEach, filter, sortBy } from 'lodash';

import { SettingUtils } from './settingUtils.class';
import { SettingConstants } from './settingConstants.class';
import { Setting } from './setting.interface';
import { RDFS, SETTING, SHACL } from '../../prefixes';

/**
 * @class shared.SimpleSetting
 *
 * An implementation of the Setting interface used for Settings that will always have exactly one form field (there may
 * be multiple instances of that form field) that can only hold a literal value.
 */
export class SimpleSetting implements Setting {
    private _topLevelSettingNodeshapeInstanceId: string;
    private _topLevelSettingNodeshapeInstance: any;
    private _formFieldPropertyShapes: any;
    private _formFieldProperties: Array<string>;
    private _values: Array<any> = [];
    private _json: any = {};
    private _requiredPropertyShape: any = {};

    constructor(settingJson: any, shapeDefinitions: any, private util) {
        settingJson.values = [];
        this.json = settingJson;
        this.requiredPropertyShape = shapeDefinitions[this.requiredPropertyShapeId];  
        this.formFieldPropertyShapes = [this.requiredPropertyShape];
        this.formFieldProperties = [SettingConstants.HAS_DATA_VALUE];
    }

    public get type(): string {
        return this.json['@id'];
    }

    public populate(setting: any): void {
        this.values = filter(setting, this.formFieldProperties[0]);

        if (!this.values.length) {
            this.addBlankValue();
        } else {
            this.values[0][SettingConstants.HAS_DATA_VALUE] = sortBy(this.values[0][SettingConstants.HAS_DATA_VALUE], '@value');
        }

        // Find Node that corresponds to the top level instance of nodeshape of the given user setting 
        // NOTE: entity['@type'] = Arrays of IRIs
        this.topLevelSettingNodeshapeInstance = filter(setting, entity => {
            return entity['@type'].includes(SETTING + 'Setting');
        });

        if (this.topLevelSettingNodeshapeInstance.length) {
            this.topLevelSettingNodeshapeInstanceId = this.topLevelSettingNodeshapeInstance[0]['@id'];
        }
    }

    public get formFieldPropertyShapes(): Array<any> {
        return this._formFieldPropertyShapes;
    }

    public set formFieldPropertyShapes(formFieldPropertyShapes: Array<any>) {
        this._formFieldPropertyShapes = formFieldPropertyShapes;
        const formFieldProperties = [];
        forEach(formFieldPropertyShapes, formField => {
            formFieldProperties.push(this.util.getPropertyId(formField, SHACL + 'path'));
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
        return this.util.getPropertyId(this.json, SHACL + 'property');
    }

    public get label(): string {
        return this.util.getPropertyValue(this.json, SHACL + 'description');
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

    public get topLevelSettingNodeshapeInstance(): any {
        return this._topLevelSettingNodeshapeInstance;
    }

    public set topLevelSettingNodeshapeInstance(instance: any) {
        this._topLevelSettingNodeshapeInstance = instance;
    }

    public get topLevelSettingNodeshapeInstanceId(): string {
        return this._topLevelSettingNodeshapeInstanceId;
    }

    public set topLevelSettingNodeshapeInstanceId(resourceId: string) {
        this._topLevelSettingNodeshapeInstanceId = resourceId;
    }

    // Will take a literal value
    addValue(value: any): void {
        if (!this.values.length) {
            this.values[0] = {};
        }
        this.util.setPropertyValue(this.values[0], SettingConstants.HAS_DATA_VALUE, value);
    }

    addBlankValue(): void {
        this.addValue('');
    }

    blankValueExists(): boolean {
        if (!this.values.length) {
            return false;
        }
        let blankValExists = false;
        this.values[0][SettingConstants.HAS_DATA_VALUE].forEach(val => {
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

        this.values[0][SettingConstants.HAS_DATA_VALUE].forEach(value => {
            const fg: FormGroup = new FormGroup({});
            const fieldsTemplate = {};
            this.formFieldPropertyShapes.forEach(field => {
                fieldsTemplate[this.util.getPropertyId(field, SHACL + 'path')] = value['@value'];
            });
            for (const control in fieldsTemplate) {
                const newFormGroup: FormGroup = new FormGroup({});
                newFormGroup.addControl(control, new FormControl(fieldsTemplate[control], Validators.required));
                fg.addControl(control, newFormGroup);
            }
            (form.get('formBlocks') as FormArray).push(fg);
        });

        return form;
    }

    public updateWithFormValues(form: FormGroup) {
        this.values[0][SettingConstants.HAS_DATA_VALUE] = [];
        form.get('formBlocks').value.forEach((value) => {
            this.util.setPropertyValue(this.values[0], SettingConstants.HAS_DATA_VALUE, String(value[SettingConstants.HAS_DATA_VALUE][SettingConstants.HAS_DATA_VALUE]));
        });
    }

    stripBlankValues(): void {
        if (!this.values.length) {
            return;
        }
        for (let i = this.values[0][SettingConstants.HAS_DATA_VALUE].length - 1; i >= 0; i--) {
            if (!this.values[0][SettingConstants.HAS_DATA_VALUE][i]['@value']) {
                this.values[0][SettingConstants.HAS_DATA_VALUE].splice(i, 1);
            }
        }
    }

    exists(): boolean {
        return !!this.topLevelSettingNodeshapeInstanceId;
    }

    numValues(): number {
        return this.values[0][SettingConstants.HAS_DATA_VALUE].length;
    }

    get settingType(): string {
        if (this.util.hasPropertyId(this.json, RDFS + 'subClassOf', SETTING + 'ApplicationSetting')) {
            return SETTING + 'ApplicationSetting';
        } else if (this.util.hasPropertyId(this.json, RDFS + 'subClassOf', SETTING + 'Preference')) {
            return SETTING + 'Preference';
        } else {
            this.util.createErrorToast('Setting Definition does not have a valid setting type.');
        }
    }

    asJsonLD(): Array<any> {
        this.stripBlankValues();
        this.values.map(val => {
            if (!SettingUtils.isJsonLd(val)) {
                SettingUtils.convertToJsonLd(val, [this.type, SETTING + 'Setting', this.settingType]);
            }
        });
        return this.values;
    }

}
