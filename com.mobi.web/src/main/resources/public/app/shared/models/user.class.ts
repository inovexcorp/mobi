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
import { get } from 'lodash';

import { FOAF, ROLES, USER } from '../../prefixes';
import { getBeautifulIRI, getPropertyId, getPropertyValue, removePropertyId, removePropertyValue, replacePropertyId, replacePropertyValue, setPropertyId } from '../utility';
import { JSONLDObject } from './JSONLDObject.interface';

/**
 * Represents a user in the system. Populates based off a provided JSON-LD object and throws an error if it does not
 * have the correct type.
 */
export class User {
  private _jsonld: JSONLDObject;
  private _displayName: string;
  
  constructor(jsonld: JSONLDObject) {
    if (!jsonld['@type'].includes(`${USER}User`)) {
      throw new Error('JSON-LD Object is not a User type');
    }
    this._jsonld = jsonld;
    this._setDisplayName();
  }

  get jsonld(): JSONLDObject {
    return this._jsonld;
  }

  get iri(): string {
    return this._jsonld['@id'];
  }

  get username(): string {
    return getPropertyValue(this._jsonld, `${USER}username`);
  }

  get external(): boolean {
    return this._jsonld['@type'].includes(`${USER}ExternalUser`);
  }

  get firstName(): string {
    return getPropertyValue(this._jsonld, `${FOAF}firstName`);
  }

  set firstName(value: string) {
    if (value) {
      replacePropertyValue(this._jsonld, `${FOAF}firstName`, this.firstName, value);
    } else {
      removePropertyValue(this._jsonld, `${FOAF}firstName`, this.firstName);
    }
    this._setDisplayName();
  }

  get lastName(): string {
    return getPropertyValue(this._jsonld, `${FOAF}lastName`);
  }

  set lastName(value: string) {
    if (value) {
      replacePropertyValue(this._jsonld, `${FOAF}lastName`, this.lastName, value);
    } else {
      removePropertyValue(this._jsonld, `${FOAF}lastName`, this.lastName);
    }
    this._setDisplayName();
  }

  get email(): string {
    return getPropertyId(this._jsonld, `${FOAF}mbox`);
  }

  set email(value: string) {
    if (value) {
      if (!value.startsWith('mailto:')) {
        value = `mailto:${value}`;
      }
      replacePropertyId(this._jsonld, `${FOAF}mbox`, this.email, value);
    } else {
      removePropertyId(this._jsonld, `${FOAF}mbox`, this.email);
    }
  }

  get displayName(): string {
    return this._displayName;
  }

  get roles(): string[] {
    return (this._jsonld[`${USER}hasUserRole`] || []).map(role => getBeautifulIRI(role['@id']).toLowerCase());
  }

  addRole(value: string): void {
    if (!this.roles.includes(value)) {
      setPropertyId(this._jsonld, `${USER}hasUserRole`, `${ROLES}${value}`);
    }
  }

  removeRole(value: string): void {
    if (this.roles.includes(value)) {
      removePropertyId(this._jsonld, `${USER}hasUserRole`, `${ROLES}${value}`);
    }
  }

  private _setDisplayName(): void {
    if (this.firstName) {
      this._displayName = this.firstName;
      if (this.lastName) {
        this._displayName += ` ${this.lastName}`;
      }
    } else {
      this._displayName = this.username || '[Not Available]';
    }
  }

  /**
   * Returns a human readable form of a user. It will default to the "firstName lastName". If only first name is
   * present, will display "firstName". If only last name is present, will display "username". If both of those
   * properties are not present, it will return the "username". If the username is not present, it will return
   * "[Not Available]".
   */
  static getDisplayName(obj: { firstName: string, lastName: string, username: string }): string {
    if (get(obj, 'firstName')) {
      if (get(obj, 'lastName')) {
        return `${obj.firstName} ${obj.lastName}`;
      } else {
        return obj.firstName;
      }
    } else {
      return get(obj, 'username') || '[Not Available]';
    }
  }
}
