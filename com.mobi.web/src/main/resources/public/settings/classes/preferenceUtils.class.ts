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
import { forEach } from 'lodash';
import { v4 as uuid } from 'uuid';

export class PreferenceUtils {
    static isSimplePreference(preferenceJson, preferenceDefinitions): boolean {
        return preferenceDefinitions[preferenceJson['http://www.w3.org/ns/shacl#property'][0]['@id']]['http://www.w3.org/ns/shacl#path'][0]['@id'] === 'http://mobi.com/ontologies/preference#hasDataValue';
    }

    static convertToJsonLd(object, intendedTypes) {
        if (Object.prototype.hasOwnProperty.call(object, '@id') || Object.prototype.hasOwnProperty.call(object, '@type')) {
            console.log('Object has unexpected structure. It appears that the object already has an id or type');
        } else {
            object['@id'] = 'http://mobi.com/preference#' + uuid.v4(); // is it ok that we always give targetClass instance a prefix of preference?
            object['@type'] = ['http://www.w3.org/2002/07/owl#Thing'];
            intendedTypes.forEach(intendedType => object['@type'].push(intendedType));
        }
    }
}