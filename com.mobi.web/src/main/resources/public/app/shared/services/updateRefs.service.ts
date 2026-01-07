/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';
import { forOwn, isString, isEmpty, has, indexOf, isPlainObject, forEach, unset, isArray, remove } from 'lodash';

/**
 * @class shared.UpdateRefsService
 *
 * Service provides utilities to recursively update or remove string references 
 * within a state object that can be nested and complex. Use to modify state from a 
 * service like `shared.OntologyStateService` and `shared.ShapesGraphStateService`.
 * 
 * NOTE:
 * All public methods in this service mutate the object passed to them directly. 
 * They do not create or return a new copy.
 */
@Injectable()
export class UpdateRefsService {
    exclude = [
        '$$hashKey'
    ];

    constructor() {}

    /**
     * Recursively finds all occurrences of a string within an state service object and replaces them with a new string.
     * 
     * 1. Object keys that match the `old` string.
     * 2. String property values that match the `old` string.
     * 3. String elements within arrays that match the `old` string.
     *
     * **NOTE:** This method mutates the input `obj` directly. It does not return a new copy.
     *
     * @param {any} stateObject The state object to traverse and update.
     * @param {string} old The string to search for (as a key, value, or array item).
     * @param {string} fresh The new string to replace `old` with.
     * @param {string[]} [exclude=[]] An optional array of keys to exclude from the update process.
     * @returns {void}
     */
    update(stateObject: any, old: string, fresh: string, exclude: string[] = []): void {
        const ex = exclude.concat(this.exclude);
        this._internalUpdate(stateObject, old, fresh, ex);
    }
    /**
     * The internal, recursive implementation of the `update` method.
     * @param {any} stateObject The current object or sub-object to process.
     * @param {string} old The string to replace.
     * @param {string} fresh The new string.
     * @param {string[]} exclude The consolidated list of keys to ignore.
     * @returns {void}
     */
    private _internalUpdate(stateObject: any, old: string, fresh: string, exclude: string[] = []): void {
        // iterates over all of the properties of the object
        forOwn(stateObject, (value, key) => {
            const excluded = indexOf(exclude, key);
            // replaces the key if it is the old value
            if (key === old && excluded === -1) {
                delete stateObject[key];
                stateObject[fresh] = value;
                key = fresh;
            }
            if (!(excluded !== -1 || !stateObject[key])) {
                // checks all items in the array
                if (isArray(value)) {
                    forEach(value, (item, index) => {
                        // checks to see if it contains the old value
                        if (item === old) {
                            stateObject[key][index] = fresh;
                        } else if (typeof item !== 'string') { // not a string, so update it
                            this._internalUpdate(stateObject[key][index], old, fresh, exclude);
                        }
                    });
                } else if (typeof value === 'object') { // objects need to be updated
                    this._internalUpdate(stateObject[key], old, fresh, exclude);
                } else if (value === old) { // change value if it matches
                    stateObject[key] = fresh;
                }
            }
        });
    }
    /**
     * Recursively finds and removes all occurrences of a specific string within state object's structure.
     * 
     * 1. Property key-value pairs where the value matches the `word`.
     * 2. Elements from arrays that match the `word`.
     *
     * After removing an item, it performs a cleanup. Any objects or arrays that become empty
     * as a result of the removal are themselves removed from their parent, preventing empty ojects/arrays.
     *
     * **NOTE:** This method mutates the input `obj` directly. It does not return a new copy.
     * 
     * @param {Object} stateObject The state object to traverse and update.
     * @param {string} word The original string that will be removed
     * @returns {void}
     */
    remove(stateObject: any, word: string): void {
        forOwn(stateObject, (value, key) => {
            if (isArray(value)) {
                remove(value, item => item === word);
                forEach(value, (item) => {
                    if (!isString(item)) {
                        this.remove(item, word);
                    }
                });
                remove(value, item => this._checkValue(item));
                if (!value.length) {
                    unset(stateObject, key);
                }
            } else if (isPlainObject(value)) {
                this.remove(value, word);
                if (this._checkValue(value)) {
                    unset(stateObject, key);
                }
            } else if (value === word) {
                unset(stateObject, key);
            }
        });
    }
    /**
     * A helper utility to determine if a value is effectively empty and can be safely removed.
     * It's considered empty if it's `lodash.isEmpty` (e.g., {}, [], "") or an object
     * containing only the Angular `$$hashKey` property.
     *
     * @param {*} value The value to check.
     * @returns {boolean} `true` if the value is considered empty, otherwise `false`.
     */
    private _checkValue(value) {
        return isEmpty(value) || (Object.keys(value).length === 1 && has(value, '$$hashKey'));
    }
}
