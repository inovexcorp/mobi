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
import { v4 as uuid } from 'uuid';
import { PreferenceConstants } from './preferenceConstants.class';
import { Preference } from '../interfaces/preference.interface';
import { has } from 'lodash';

export class PreferenceUtils {
    static isSimplePreference(preferenceJson, shapeDefinitions): boolean {
        const requiredPropertyShape = shapeDefinitions[preferenceJson['http://www.w3.org/ns/shacl#property'][0]['@id']];
        return requiredPropertyShape['http://www.w3.org/ns/shacl#path'][0]['@id'] === PreferenceConstants.HAS_DATA_VALUE;
    }

    static convertToJsonLd(object, intendedTypes) {
        if (has(object, '@id')|| has(object, '@type')) {
            console.log('Object has unexpected structure. It appears that the object already has an id or type');
        } else {
            object['@id'] = 'http://mobi.com/preference#' + uuid.v4(); // is it ok that we always give targetClass instance a prefix of preference?
            object['@type'] = ['http://www.w3.org/2002/07/owl#Thing'];
            intendedTypes.forEach(intendedType => object['@type'].push(intendedType));
        }
        return object;
    }

    static isJsonLd(obj): boolean {
        return has(obj, '@id') && has(obj, '@type');
    }

    static userPrefComparator(preference: Preference) {
        return function(a, b) {
            if (a[preference.formFieldProperties[0]][0]['@value'] < b[preference.formFieldProperties[0]][0]['@value']) {
                return -1;
            } else if (a[preference.formFieldProperties[0]][0]['@value'] > b[preference.formFieldProperties[0]][0]['@value']) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}