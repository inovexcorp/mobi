/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { forOwn, isString, isEmpty, has, indexOf, isPlainObject, forEach, unset, isArray, remove } from 'lodash';

updateRefsService.$inject = ['$filter'];

/**
 * @ngdoc service
 * @name shared.service:updateRefsService
 * @requires $filter
 *
 * @description
 * `updateRefsService` is a service that provides functionality to uypdate references
 * in an object from {@link ontologyManager.service:ontologyManager ontologyManager}.
 */
function updateRefsService($filter) {
    var self = this;
    var exclude = [
            '$$hashKey'
        ];

    /**
     * @ngdoc method
     * @name update
     * @methodOf shared.service:updateRefsService
     *
     * @description
     * Changes every instance of a specific key in an object from
     * {@link ontologyManager.service:ontologyManager ontologyManager} to a new string.
     * It directly affects the passed in object instead of creating a new copy.
     *
     * @param {Object} obj An object from {@link ontologyManager.service:ontologyManager ontologyManager}.
     * Presumedly it is an ontology object.
     * @param {string} old The original key string that will be updated
     * @param {string} fresh The new string to change the old key into
     */
    self.update = function(obj, old, fresh) {
        var freshSplit = $filter('splitIRI')(fresh);
        // iterates over all of the properties of the object
        forOwn(obj, (value, key) => {
            var excluded = indexOf(exclude, key);
            // replaces the key if it is the old value
            if (key === old && excluded === -1) {
                delete obj[key];
                obj[fresh] = value;
                key = fresh;
            }
            if (!(excluded !== -1 || !obj[key])) {
                // checks all items in the array
                if (isArray(value)) {
                    forEach(value, (item, index) => {
                        // checks to see if it contains the old value
                        if (item === old) {
                            obj[key][index] = fresh;
                        }
                        // not a string, so update it
                        else if (typeof item !== 'string') {
                            self.update(obj[key][index], old, fresh);
                        }
                    });
                }
                // objects need to be updated
                else if (typeof value === 'object') {
                    self.update(obj[key], old, fresh);
                }
                // change string value if it matches
                else if (value === old) {
                    obj[key] = fresh;
                }
            }
        });
    }
    /**
     * @ngdoc method
     * @name remove
     * @methodOf shared.service:updateRefsService
     *
     * @description
     * Removes every instance of a specific key in an object from
     * {@link ontologyManager.service:ontologyManager ontologyManager}. It directly
     * affects the passed in object instead of creating a new copy.
     *
     * @param {Object} obj An object from {@link ontologyManager.service:ontologyManager ontologyManager}.
     * Presumably it is an ontology object.
     * @param {string} word The original string that will be removed
     */
    self.remove = function(obj, word) {
        forOwn(obj, (value, key) => {
            if (isArray(value)) {
                remove(value, item => item === word);
                forEach(value, (item, index) => {
                    if (!isString(item)) {
                        self.remove(item, word);
                    }
                });
                remove(value, item => checkValue(item));
                if (!value.length) {
                    unset(obj, key);
                }
            } else if (isPlainObject(value)) {
                self.remove(value, word);
                if (checkValue(value)) {
                    unset(obj, key);
                }
            } else if (value === word) {
                unset(obj, key);
            }
        });
    }
    function checkValue(value) {
        return isEmpty(value) || (Object.keys(value).length === 1 && has(value, '$$hashKey'));
    }
}

export default updateRefsService;