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
import { Injectable } from '@angular/core';
import { forOwn, isString, isEmpty, has, indexOf, isPlainObject, forEach, unset, isArray, remove } from 'lodash';

/**
 * @class shared.UpdateRefsService
 *
 * `updateRefsService` is a service that provides functionality to update references in an object from
 * {@link shared.OntologyManagerService}.
 */
@Injectable()
export class UpdateRefsService {
    exclude = [
        '$$hashKey'
    ];

    constructor() {}

    /**
     * Changes every instance of a specific key in an object from {@link shared.OntologyManagerService} to a new string.
     * It directly affects the passed in object instead of creating a new copy.
     *
     * @param {Object} obj An object from {@link shared.OntologyManagerService}. Assumed to be an ontology object.
     * @param {string} old The original key string that will be updated
     * @param {string} fresh The new string to change the old key into
     */
    update(obj: any, old: string, fresh: string, exclude: string[] = []): void {
        const ex = exclude.concat(this.exclude);
        this._internalUpdate(obj, old, fresh, ex);
    }
    private _internalUpdate(obj: any, old: string, fresh: string, exclude: string[] = []): void {
        // iterates over all of the properties of the object
        forOwn(obj, (value, key) => {
            const excluded = indexOf(exclude, key);
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
                        } else if (typeof item !== 'string') { // not a string, so update it
                            this._internalUpdate(obj[key][index], old, fresh, exclude);
                        }
                    });
                } else if (typeof value === 'object') { // objects need to be updated
                    this._internalUpdate(obj[key], old, fresh, exclude);
                } else if (value === old) { // change value if it matches
                    obj[key] = fresh;
                }
            }
        });
    }
    /**
     * Removes every instance of a specific key in an object from
     * {@link shared.OntologyManagerService}. It directly
     * affects the passed in object instead of creating a new copy.
     *
     * @param {Object} obj An object from {@link shared.OntologyManagerService}. Assumed to be an ontology object.
     * @param {string} word The original string that will be removed
     */
    remove(obj: any, word: string): void {
        forOwn(obj, (value, key) => {
            if (isArray(value)) {
                remove(value, item => item === word);
                forEach(value, (item) => {
                    if (!isString(item)) {
                        this.remove(item, word);
                    }
                });
                remove(value, item => this._checkValue(item));
                if (!value.length) {
                    unset(obj, key);
                }
            } else if (isPlainObject(value)) {
                this.remove(value, word);
                if (this._checkValue(value)) {
                    unset(obj, key);
                }
            } else if (value === word) {
                unset(obj, key);
            }
        });
    }
    private _checkValue(value) {
        return isEmpty(value) || (Object.keys(value).length === 1 && has(value, '$$hashKey'));
    }
}
