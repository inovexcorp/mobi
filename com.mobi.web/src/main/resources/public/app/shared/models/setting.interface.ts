/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { FormValues } from '../../shacl-forms/components/shacl-form/shacl-form.component';
import { JSONLDObject } from './JSONLDObject.interface';
import { SHACLFormFieldConfig } from '../../shacl-forms/models/shacl-form-field-config';

/**
 * @interface shared.Setting
 *
 * `Setting` is an interface that defines defines the members and methods that can be used 
 * to access, modify, and manipulate setting data retrieved from the backend.
 */
export interface Setting {
    /**
     * 'json' holds the underlying JSON-LD for the NodeShape that is also a subclass of 
     * `http://mobi.com/ontologies/setting#Preference` or `http://mobi.com/ontologies/setting#ApplicationSetting`
     * that the `Setting` object represents
     * @type {JSONLDObject}
     */
    json: JSONLDObject;

    /**
     * 'formFieldPropertyShapes' is a JSON-LD array of the lowest level PropertyShapes that define the form field(s)
     * for the `Setting`.
     * @type {Array<JSONLDObject>}
     */
    formFieldPropertyShapes: Array<JSONLDObject>;

    /**
     * 'formFieldProperties' is an array of of IRIs describing the properties for each unique form field of the
     * `Setting` object. This also corresponds to the SHACL path for each of the `formFieldPropertyShapes`.
     * @type {Array<string>}
     */
    formFieldProperties: Array<string>;

    /**
     * 'values' is a JSON-LD array representing the values of each setting form field.  The values may stored
     * entirely in the first element of the array or in different elements of the array depending on the `Setting` 
     * implementation.
     * @type {Array<JSONLDObject>}
     */
    values: Array<JSONLDObject>;

    /**
     * 'topLevelSettingNodeshapeInstanceId' is the IRI of the instance of the NodeShape that is also a subclass of
     * `http://mobi.com/ontologies/setting#Preference` or `http://mobi.com/ontologies/setting#ApplicationSetting` that
     * the Setting object represents
     * @type {string}
     */
    topLevelSettingNodeshapeInstanceId: string;

    /**
    * 'label' is the display text that will appear above each `Setting` rendered by the frontend
     * @type {string}
     */
    label: string;

    /**
     * 'type' is the IRI of the NodeShape that is also a subclass of `http://mobi.com/ontologies/setting#Preference` or
     * `http://mobi.com/ontologies/setting#ApplicationSetting` that the `Setting` object represents
     * @type {string}
     */
    type: string;

    /**
     * 'formFieldConfigs' is an array of the form field configurations aligning with the Property Shapes to pass to the
     * SHACL web form generation components.
     * @type {string}
     */
    formFieldConfigs: SHACLFormFieldConfig[];

    /**
     * Populates the `Setting` instance with values from the passed in JSON-LD representing all the instances of this
     * `Setting` type
     * 
     * @param {JSONLDObject[]} setting The JSON-LD of current values for the setting
     */
    populate(setting: JSONLDObject[]): void;
    
    /**
     * Updates the values on the `Setting` object with the current values of a SHACL based Form
     * 
     * @param {FormValues} values The form values to use to rebuild the values on the `Setting` object
     */
    updateWithFormValues(formValues: FormValues): void;

    /**
     * Checks if the `Setting` object was originally populated with an instance from the backend
     * 
     * @returns {boolean} signifying if the `Setting` object was originally populated with an instance from the backend
     */
    exists(): boolean;
}
