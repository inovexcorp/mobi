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
import { v4 as uuid } from 'uuid';
import { has } from 'lodash';

import { SettingConstants } from './settingConstants.class';
import { Setting } from './setting.interface';
import { OWL, SHACL } from '../../prefixes';

/**
 * @class shared.SettingUtils
 *
 * A helper class that contains methods used by the Setting implementations
 */
export class SettingUtils {

    static isSimpleSetting(settingJson, shapeDefinitions): boolean {
        const requiredPropertyShape = shapeDefinitions[settingJson[SHACL + 'property'][0]['@id']];
        return requiredPropertyShape[SHACL + 'path'][0]['@id'] === SettingConstants.HAS_DATA_VALUE;
    }

    static convertToJsonLd(object, intendedTypes) {
        if (has(object, '@id') || has(object, '@type')) {
            console.log('Object has unexpected structure. It appears that the object already has an id or type');
        } else {
            object['@id'] = 'http://mobi.com/setting#' + uuid();
            // object['@id'] = 'http://mobi.com/setting#' + uuid.v4();
            object['@type'] = [OWL + 'Thing'];
            intendedTypes.forEach(intendedType => object['@type'].push(intendedType));
        }
        return object;
    }

    static isJsonLd(obj): boolean {
        return has(obj, '@id') && has(obj, '@type');
    }

    static settingComparator(setting: Setting) {
        return function(a, b) {
            if (a[setting.formFieldProperties[0]][0]['@value'] < b[setting.formFieldProperties[0]][0]['@value']) {
                return -1;
            } else if (a[setting.formFieldProperties[0]][0]['@value'] > b[setting.formFieldProperties[0]][0]['@value']) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}
