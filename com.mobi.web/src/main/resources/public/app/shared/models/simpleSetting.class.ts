/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { FormValues } from '../../shacl-forms/models/form-values.interface';
import { getPropertyId, getPropertyValue, hasPropertyId, getPropertyIds, getShaclGeneratedData } from '../utility';

/**
 * @class shared.SimpleSetting
 *
 * An implementation of the Setting interface used for Settings that supports both hasDataValue and hasObjectValue.
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
    getPropertyIds(this.json, `${SHACL}property`).forEach(propertyId => {
      this._formFieldPropertyShapes.push(shapeDefinitions[propertyId]);
    });
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

  /**
   * Updates this setting's `values` with the JSON-LD found in the backend for the setting type. Sorts the `values`
   * array as well.
   * 
   * @param {JSONLDObject} setting The JSON-LD array of data returned by the backend when the values for this setting
   * are retrieved.
   */
  public populate(setting: JSONLDObject[]): void {
    if (setting.findIndex(obj => obj['@type'] && obj['@type'].includes(this.type)) >= 0) {
      this._values = setting;
    }

    if (this.values.length) {
      // Sort setting instances by their IRIs
      this._values = sortBy(this.values, '@id');
      // Sort the properties for each form field on each setting instance. Assumes the path will be a data property
      this.values.forEach(val => this.formFieldProperties.forEach(prop => {
        if (val[prop]) {
          val[prop] = sortBy(val[prop], subVal => subVal['@value'] || subVal['@id']);
        }
      }));
    }
    
    // Assumes there is only one instance for the setting instead of multiple
    // Find Node that corresponds to the top level instance of NodeShape of the given user setting 
    const topNodeShape = setting.find(entity => entity['@type'] && entity['@type'].includes(this.type));

    if (topNodeShape) {
      this._topLevelSettingNodeshapeInstanceId = topNodeShape['@id'];
    }
  }

  /**
   * Updates the stored setting `values` with the latest data from a SHACL form. Will create an instance of the setting
   * type if one doesn't already exist. CLears out any existing associated objects and regenerates them on updates.
   * 
   * @param {FormValues} formValues Form field values from a SHACL form assumed to have been generated for this Setting
   */
  public updateWithFormValues(formValues: FormValues): void {
    if (!this.values.length) {
      this.values.push({
        '@id': `http://mobi.solutions/setting#${v4()}`,
        '@type': [`${OWL}Thing`, `${SETTING}Setting`, this.settingType, this.type]
      });
    }
    // Realistically there should really only be one of these in the array
    this.values.filter(valObj => valObj['@type'].includes(this.settingType)).forEach(settingInstance => {
      this._formFieldProperties.forEach(prop => {
        // Clears out any complex setting associated objects
        (settingInstance[prop] || []).forEach(obj => {
          if (obj['@id']) {
            const valueObjIdx = this.values.findIndex(valObj => valObj['@id'] === obj['@id']);
            if (valueObjIdx >= 0) {
              this.values.splice(valueObjIdx, 1);
            }
          }
        });
      });
      // Generate JSON-LD from the form values for teh provided setting instance.
      // Mutates the setting instance with the appropriate properties
      const generatedData = getShaclGeneratedData(settingInstance, this._formFieldConfigs, formValues);
      // The first element in the array is the setting instance which is already in the values array
      generatedData.splice(0, 1);
      // Add any generated associated objects to the values array
      this._values = this._values.concat(generatedData);
    });
  }

  /**
   * @returns {boolean} True if a setting value for this definition was found in the backend.
   */
  public exists(): boolean {
    return !!this.topLevelSettingNodeshapeInstanceId;
  }
}
