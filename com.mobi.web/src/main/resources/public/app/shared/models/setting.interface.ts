import { FormGroup } from '@angular/forms';

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

 /**
 * @ngdoc interface
 * @name shared.models:Setting
 *
 * @description
 * `Setting` is an interface that defines defines the members and methods that can be used 
 * to access, modify, and manipulate setting data retrieved from the backend.
 */
export interface Setting {
    /**
     * @ngdoc property
     * @name json
     * @propertyOf settings.interface
     *
     * @description
     * 'json' holds the underlying json-ld for the nodeshape that is also a subclass of 
     * http://mobi.com/ontologies/setting#Preference or http://mobi.com/ontologies/setting#ApplicationSetting
     * that the Setting object represents
     */
    json: any;

    /**
     * @ngdoc property
     * @name formFieldPropertyShapes
     * @propertyOf settings.interface
     *
     * @description
     * 'formFieldPropertyShapes' are the json containing the lowest level property shapes that define the 
     * form field(s) for the Setting
     */
    formFieldPropertyShapes: any;

    /**
     * @ngdoc property
     * @name formFieldProperties
     * @propertyOf settings.interface
     * @type {Array<string>}

     * @description
     * 'formFieldProperties' is an array of of iris describing the shacl path for each unique formfield of the
     * setting object. This also corresponds to the shacl path for each of the formFieldPropertyShapes
     */
    formFieldProperties: Array<string>;

    /**
     * @ngdoc property
     * @name values
     * @propertyOf settings.interface
     * @type {Array<any>}

     * @description
     * 'values' is an array of objects representing the values of each setting form field. 
     * The values may stored entirely in the first element of the array or in different elements of the array depending on the Setting implementation.
     */
    values: Array<any>;

    /**
     * @ngdoc property
     * @name requiredPropertyShape
     * @propertyOf settings.interface

     * @description
     * 'requiredPropertyShape' is the json-ld representation of the PropertyShape that every nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/setting#Preference or 
     * http://mobi.com/ontologies/setting#ApplicationSetting must point to.
     */
    requiredPropertyShape: any;

    /**
     * @ngdoc property
     * @name topLevelSettingNodeshapeInstanceId
     * @propertyOf settings.interface
     * @type {string}
     *
     * @description
     * 'topLevelSettingNodeshapeInstanceId' is the resource id of the user's instance of the nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/setting#Preference or 
     * http://mobi.com/ontologies/setting#ApplicationSetting that the Setting object represents
     */
    topLevelSettingNodeshapeInstanceId: string;

    /**
     * @ngdoc property
     * @name topLevelSettingNodeshapeInstance
     * @propertyOf settings.interface
     *
     * @description
     * 'topLevelSettingNodeshapeInstance' is the json-ld representation of the user's instance of the nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/setting#Preference or 
     * http://mobi.com/ontologies/setting#ApplicationSetting that the Setting object represents
     */
    topLevelSettingNodeshapeInstance: any;

    /**
     * @ngdoc property
     * @name label
     * @propertyOf settings.interface
     * @type {string}
     *
     * @description
     * 'label' is the label that will appear above each Setting rendered by the frontend
     */
    label: string;

    /**
     * @ngdoc property
     * @name type
     * @propertyOf settings.interface
     * @type {string}
     *
     * @description
     * 'type' is the resource id of the nodeshape that is also a subclass of http://mobi.com/ontologies/setting#Preference
     * or http://mobi.com/ontologies/setting#ApplicationSetting that the Setting object represents
     */
    type: string;

    /**
     * @ngdoc method
     * @name populate
     * @methodOf settings.interface
     * 
     * @description 
     * Populates the Setting instance with values from the passed in user setting json
     * 
     * @param setting The json representation of a users current values for the setting
     */
    populate(setting): void;

    /**
     * @ngdoc method
     * @name numValues
     * @methodOf settings.interface
     * 
     * @description 
     * Retrieves the number of values on the setting object
     * 
     * @return {number} The number of values on the setting object
     */
    numValues(): number;

    /**
     * @ngdoc method
     * @name addValue
     * @methodOf settings.interface
     * 
     * @description 
     * Adds a user setting value to the setting object
     * 
     * @param value The value to add to the setting
     */
    addValue(value): void;

    /**
     * @ngdoc method
     * @name addBlankValue
     * @methodOf settings.interface
     * 
     * @description 
     * Adds a blank value to the setting object
     */
    addBlankValue(): void;

    /**
     * @ngdoc method
     * @name buildForm
     * @methodOf settings.interface
     * 
     * @description 
     * Uses the current values on the Setting obect to construct a FormGroup to be rendered on the frontend.
     * 
     * @return {FormGroup} The form generated by the contents of the Setting object to be rendered on the frontend.
     */
    buildForm(): FormGroup;

    /**
     * @ngdoc method
     * @name updateWithFormValues
     * @methodOf settings.interface
     * 
     * @description 
     * Updates the values on the Setting object with the current contents of the passed in form.
     * 
     * @param form The form to use to rebuild the values on the Setting object
     */
    updateWithFormValues(form: FormGroup): void;

    /**
     * @ngdoc method
     * @name stripBlankValues
     * @methodOf settings.interface
     * 
     * @description 
     * Remove any values on the setting object that are blank
     */
    stripBlankValues(): void;

    /**
     * @ngdoc method
     * @name exists
     * @methodOf settings.interface
     * 
     * @description 
     * Checks if the Setting object was originally populated with a user setting from the backend
     * 
     * @returns {Boolean} signifying if the Setting object was originally populated with a user setting from the backend
     */
    exists(): boolean;

    /**
     * @ngdoc method
     * @name asJsonLD
     * @methodOf settings.interface
     * 
     * @description 
     * Constructs the JSON-LD representation of values on the setting object
     * 
     * @returns {Array<any>} The JSON-LD representation of values on the setting object
     */
    asJsonLD(): Array<any>;
}
