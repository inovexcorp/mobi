import { FormGroup } from "@angular/forms";

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

 /**
 * @ngdoc interface
 * @name settings.interface:preference
 *
 * @description
 * `Preference` is an interface that defines defines the members and methods that can be used 
 * to access, modify, and manipulate preference data retrieved from the backend.
 */
export interface Preference {
    /**
     * @ngdoc property
     * @name json
     * @propertyOf settings.interface.preference
     *
     * @description
     * 'json' holds the underlying json-ld for the nodeshape that is also a subclass of 
     * http://mobi.com/ontologies/preference#Preference that the Preference object represents
     */
    json: any;

    /**
     * @ngdoc property
     * @name formFieldPropertyShapes
     * @propertyOf settings.interface.preference
     *
     * @description
     * 'formFieldPropertyShapes' are the json containing the lowest level property shapes that define the 
     * form field(s) for the Preference
     */
    formFieldPropertyShapes: any;

    /**
     * @ngdoc property
     * @name formFieldProperties
     * @propertyOf settings.interface.preference
     * @type {Array<string>}

     * @description
     * 'formFieldProperties' is an array of of iris describing the shacl path for each unique formfield of the
     * preference object. This also corresponds to the shacl path for each of the formFieldPropertyShapes
     */
    formFieldProperties: Array<string>;

    /**
     * @ngdoc property
     * @name values
     * @propertyOf settings.interface.preference
     * @type {Array<any>}

     * @description
     * 'values' is an array of objects representing the values of each preference form field. The values may stored entirely in the first element of the array or in different elements of the array depending on the Preference implementation.
     */
    values: Array<any>;

    /**
     * @ngdoc property
     * @name requiredPropertyShape
     * @propertyOf settings.interface.preference

     * @description
     * 'requiredPropertyShape' is the json-ld representation of the PropertyShape that every nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/preference#Preference must point to.
     */
    requiredPropertyShape: any;

    /**
     * @ngdoc property
     * @name topLevelPreferenceNodeshapeInstanceId
     * @propertyOf settings.interface.preference
     * @type {string}
     *
     * @description
     * 'topLevelPreferenceNodeshapeInstanceId' is the resource id of the user's instance of the nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/preference#Preference that the Preference object represents
     */
    topLevelPreferenceNodeshapeInstanceId: string;

    /**
     * @ngdoc property
     * @name topLevelPreferenceNodeshapeInstance
     * @propertyOf settings.interface.preference
     *
     * @description
     * 'topLevelPreferenceNodeshapeInstance' is the json-ld representation of the user's instance of the nodeshape 
     * that is also a subclass of http://mobi.com/ontologies/preference#Preference that the Preference object represents
     */
    topLevelPreferenceNodeshapeInstance: any;

    /**
     * @ngdoc property
     * @name label
     * @propertyOf settings.interface.preference
     * @type {string}
     *
     * @description
     * 'label' is the label that will appear above each Preference rendered by the frontend
     */
    label: string;

    /**
     * @ngdoc property
     * @name type
     * @propertyOf settings.interface.preference
     * @type {string}
     *
     * @description
     * 'type' is the resource id of the nodeshape that is also a subclass of http://mobi.com/ontologies/preference#Preference
     * that the Preference object represents
     */
    type: string;

    /**
     * @ngdoc method
     * @name populate
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Populates the Preference instance with values from the passed in user preference json
     * 
     * @param userPreference The json representation of a users current values for the preference
     */
    populate(userPreference): void;

    /**
     * @ngdoc method
     * @name numValues
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Retrieves the number of values on the preference object
     * 
     * @return {number} The number of values on the preference object
     */
    numValues(): number;

    /**
     * @ngdoc method
     * @name addValue
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Adds a user preference value to the preference object
     * 
     * @param value The value to add to the preference
     */
    addValue(value): void;

    /**
     * @ngdoc method
     * @name addBlankValue
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Adds a blank value to the preference object     * 
     */
    addBlankValue(): void;

    /**
     * @ngdoc method
     * @name buildForm
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Uses the current values on the Preference obect to construct a FormGroup to be rendered on the frontend.
     * 
     * @return {FormGroup} The form generated by the contents of the Preference object to be rendered on the frontend.
     */
    buildForm(): FormGroup;

    /**
     * @ngdoc method
     * @name updateWithFormValues
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Updates the values on the Preference object with the current contents of the passed in form.
     * 
     * @param form The form to use to rebuild the values on the Preference object
     */
    updateWithFormValues(form: FormGroup): void;

    /**
     * @ngdoc method
     * @name stripBlankValues
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Remove any values on the preference object that are blank
     */
    stripBlankValues(): void;

    /**
     * @ngdoc method
     * @name exists
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Checks if the Preference object was originally populated with a user preference from the backend
     * 
     * @returns {Boolean} signifying if the Preference object was originally populated with a user preference from the backend
     */
    exists(): boolean;

    /**
     * @ngdoc method
     * @name asJsonLD
     * @methodOf settings.interface.preference
     * 
     * @description 
     * Constructs the JSON-LD representation of values on the preference object
     * 
     * @returns {Array<any>} The JSON-LD representation of values on the preference object
     */
    asJsonLD(): Array<any>;
}
