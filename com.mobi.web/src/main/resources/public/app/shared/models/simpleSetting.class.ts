/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { v4 } from 'uuid';
import { sortBy } from 'lodash';

import { Setting } from './setting.interface';
import { DCTERMS, OWL, RDFS, SETTING, SHACL } from '../../prefixes';
import { JSONLDObject } from './JSONLDObject.interface';
import { SHACLFormFieldConfig } from '../../shacl-forms/models/shacl-form-field-config';
import { FormValues } from '../../shacl-forms/components/shacl-form/shacl-form.component';
import { getPropertyId, getPropertyValue, hasPropertyId, setPropertyValue } from '../utility';

/**
 * @class shared.SimpleSetting
 *
 * An implementation of the Setting interface used for Settings that will always have exactly one form field (there may
 * be multiple instances of that form field) that can only hold a literal value.
 */
export class SimpleSetting implements Setting {
    private _topLevelSettingNodeshapeInstanceId: string;
    private _formFieldPropertyShapes: Array<JSONLDObject> = [];
    private _formFieldConfigs: SHACLFormFieldConfig[] = [];
    private _formFieldProperties: Array<string> = [];
    private _values: Array<JSONLDObject> = [];
    private _json: JSONLDObject;

    constructor(settingJson: JSONLDObject, shapeDefinitions: {[key: string]: JSONLDObject}) {
        this._json = settingJson;
        this._formFieldPropertyShapes = [shapeDefinitions[getPropertyId(this.json, `${SHACL}property`)]];
        this._formFieldPropertyShapes.forEach(formField => {
            this._formFieldProperties.push(getPropertyId(formField, `${SHACL}path`));
            this._formFieldConfigs.push(new SHACLFormFieldConfig(this.json, formField['@id'], Object.values(shapeDefinitions)));
        });
    }

    public get type(): string {
      return this.json['@id'];
    }

    public get formFieldPropertyShapes(): Array<JSONLDObject> {
        return this._formFieldPropertyShapes;
    }

    public get label(): string {
        return getPropertyValue(this.json, `${DCTERMS}description`);
    }

    public get json(): JSONLDObject {
        return this._json;
    }

    public get formFieldProperties(): Array<string> {
        return this._formFieldProperties;
    }

    public get values(): Array<JSONLDObject> {
        return this._values;
    }

    public get topLevelSettingNodeshapeInstanceId(): string {
        return this._topLevelSettingNodeshapeInstanceId;
    }

    public get formFieldConfigs(): SHACLFormFieldConfig[] {
        return this._formFieldConfigs;
    }

    public get settingType(): string {
      if (hasPropertyId(this.json, `${RDFS}subClassOf`, `${SETTING}ApplicationSetting`)) {
          return `${SETTING}ApplicationSetting`;
      } else if (hasPropertyId(this.json, `${RDFS}subClassOf`, `${SETTING}Preference`)) {
          return `${SETTING}Preference`;
      } else {
          console.error('Setting Definition does not have a valid setting type');
          return '';
      }
    }

    public populate(setting: JSONLDObject[]): void {
        // Does not support other entities in the array besides instances of this Setting type
        this._values = setting.filter(entity => entity['@type'] && entity['@type'].includes(this.type));

        if (this.values.length) {
          // Sort setting instances by their IRIs
          this._values = sortBy(this.values, '@id');
          // Sort the properties for each form field on each setting instance. Assumes the path will be a data property
          this.values.forEach(val => this.formFieldProperties.forEach(prop => val[prop] = sortBy(val[prop], '@value')));
        }
        
        // Assumes there is only one instance for the setting instead of multiple
        // Find Node that corresponds to the top level instance of NodeShape of the given user setting 
        const topNodeShape = setting.find(entity => entity['@type'] && entity['@type'].includes(this.type));

        if (topNodeShape) {
            this._topLevelSettingNodeshapeInstanceId = topNodeShape['@id'];
        }
    }

    public updateWithFormValues(formValues: FormValues): void {
        if (!this.values.length) {
            this.values.push({
                '@id': `http://mobi.solutions/setting#${v4()}`,
                '@type': [`${OWL}Thing`, `${SETTING}Setting`, this.settingType, this.type]
            });
        }
        this._formFieldProperties.forEach(prop => {
            this.values.forEach(settingInstance => {
                settingInstance[prop] = [];
                if (Array.isArray(formValues[prop])) {
                    (formValues[prop] as string[] | { [key:string]: string }[]).forEach(val => {
                        let valToSet;
                        if (typeof val === 'string') {
                            valToSet = val as string;
                        } else {
                            const objVal = val as { [key: string]: string };
                            const valKey = Object.keys(objVal).find(key => key.startsWith(prop));
                            if (valKey) {
                                valToSet = objVal[valKey];
                            }
                        }
                        if (valToSet) {
                            setPropertyValue(settingInstance, prop, valToSet);
                        }
                    });
                } else {
                    const valToSet = '' + formValues[prop];
                    if (valToSet) {
                        setPropertyValue(settingInstance, prop, valToSet);
                    }
                }
                if (!settingInstance[prop].length) {
                    delete settingInstance[prop];
                }
            });
        });
    }

    public exists(): boolean {
        return !!this.topLevelSettingNodeshapeInstanceId;
    }

    static isSimpleSetting(settingJson: JSONLDObject, shapeDefinitions: {[key: string]: JSONLDObject}): boolean {
        const requiredPropertyShape = shapeDefinitions[getPropertyId(settingJson, `${SHACL}property`)];
        return !!requiredPropertyShape && !requiredPropertyShape[`${SHACL}node`];
    }
}
