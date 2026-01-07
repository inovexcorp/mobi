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
import { FOAF, ROLES, USER } from '../../prefixes';
import { User } from './user.class';

describe('User', () => {
  describe('static method getDisplayName should return the correct value', () => {
    it('when there is a first and last', function() {
      expect(User.getDisplayName({ firstName: 'First', lastName: 'Last', username: 'user' })).toEqual('First Last');
    });
    it('when there is a first but no last', function() {
      expect(User.getDisplayName({ firstName: 'First', lastName: '', username: 'user' })).toEqual('First');
    });
    it('when there is not a first or last but there is a username', function() {
      expect(User.getDisplayName({ firstName: '', lastName: '', username: 'user' })).toEqual('user');
    });
    it('when there is no first, last, or username', function() {
      expect(User.getDisplayName({ firstName: '', lastName: '', username: '' })).toEqual('[Not Available]');
    });
  });
  it('should throw an error if the JSON-LD does not have the correct type', () => {
    expect(() => new User({'@id': '', '@type': []})).toThrow(new Error('JSON-LD Object is not a User type'));
  });
  it('should create successfully with valid JSON-LD', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`]
    };
    const result = new User(jsonld);
    expect(result.jsonld).toEqual(jsonld);
    expect(result.iri).toEqual('user');
    expect(result.external).toBeFalse();
    expect(result.username).toEqual('');
    expect(result.firstName).toEqual('');
    expect(result.lastName).toEqual('');
    expect(result.displayName).toEqual('[Not Available]');
    expect(result.email).toEqual('');
    expect(result.roles).toEqual([]);
  });
  it('should successfully determine whether the user is external', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`, `${USER}ExternalUser`],
    };
    const result = new User(jsonld);
    expect(result.external).toBeTrue();
  });
  it('should successfully get the username', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${USER}username`]: [{ '@value': 'user' }]
    };
    const result = new User(jsonld);
    expect(result.username).toEqual('user');
  });
  it('should successfully get the firstName', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${FOAF}firstName`]: [{ '@value': 'John' }]
    };
    const result = new User(jsonld);
    expect(result.firstName).toEqual('John');
  });
  it('should successfully get the lastName', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${FOAF}lastName`]: [{ '@value': 'Doe' }]
    };
    const result = new User(jsonld);
    expect(result.lastName).toEqual('Doe');
  });
  it('should successfully get the email', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${FOAF}mbox`]: [{ '@id': 'mailto:test@test.com' }]
    };
    const result = new User(jsonld);
    expect(result.email).toEqual('mailto:test@test.com');
  });
  describe('should successfully get the displayName', () => {
    it('when there is a first and last', function() {
      const jsonld = {
        '@id': 'user',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'user' }],
        [`${FOAF}firstName`]: [{ '@value': 'John' }],
        [`${FOAF}lastName`]: [{ '@value': 'Doe' }]
      };
      const result = new User(jsonld);
      expect(result.displayName).toEqual('John Doe');
    });
    it('when there is a first but no last', function() {
      const jsonld = {
        '@id': 'user',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'user' }],
        [`${FOAF}firstName`]: [{ '@value': 'John' }],
      };
      const result = new User(jsonld);
      expect(result.displayName).toEqual('John');
    });
    it('when there is not a first or last but there is a username', function() {
      const jsonld = {
        '@id': 'user',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'user' }],
      };
      const result = new User(jsonld);
      expect(result.displayName).toEqual('user');
    });
  });
  it('should successfully get the roles', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${USER}hasUserRole`]: [{ '@id': `${ROLES}user` }]
    };
    const result = new User(jsonld);
    expect(result.roles).toEqual(['user']);
  });
  it('should successfully set the first name', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
    };
    const result = new User(jsonld);
    result.firstName = 'John';
    expect(result.firstName).toEqual('John');
    expect(result.jsonld[`${FOAF}firstName`]).toEqual([{ '@value': 'John' }]);

    result.firstName = 'Bruce';
    expect(result.firstName).toEqual('Bruce');
    expect(result.jsonld[`${FOAF}firstName`]).toEqual([{ '@value': 'Bruce' }]);
  });
  it('should successfully set the last name', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
    };
    const result = new User(jsonld);
    result.lastName = 'Doe';
    expect(result.lastName).toEqual('Doe');
    expect(result.jsonld[`${FOAF}lastName`]).toEqual([{ '@value': 'Doe' }]);

    result.lastName = 'Wayne';
    expect(result.lastName).toEqual('Wayne');
    expect(result.jsonld[`${FOAF}lastName`]).toEqual([{ '@value': 'Wayne' }]);
  });
  it('should successfully set the email', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
    };
    const result = new User(jsonld);
    result.email = 'test@test.com';
    expect(result.email).toEqual('mailto:test@test.com');
    expect(result.jsonld[`${FOAF}mbox`]).toEqual([{ '@id': 'mailto:test@test.com' }]);

    result.email = 'mailto:iambatman@test.com';
    expect(result.email).toEqual('mailto:iambatman@test.com');
    expect(result.jsonld[`${FOAF}mbox`]).toEqual([{ '@id': 'mailto:iambatman@test.com' }]);
  });
  it('should successfully add a role', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
    };
    const result = new User(jsonld);
    result.addRole('user');
    expect(result.roles).toEqual(['user']);
    expect(result.jsonld[`${USER}hasUserRole`]).toEqual([{ '@id': `${ROLES}user` }]);

    result.addRole('admin');
    expect(result.roles).toEqual(['user', 'admin']);
    expect(result.jsonld[`${USER}hasUserRole`]).toEqual([{ '@id': `${ROLES}user` }, { '@id': `${ROLES}admin` }]);
  });
  it('should successfully remove a role', () => {
    const jsonld = {
      '@id': 'user',
      '@type': [`${USER}User`],
      [`${USER}hasUserRole`]: [{ '@id': `${ROLES}user`, }, { '@id': `${ROLES}admin` }]
    };
    const result = new User(jsonld);
    result.removeRole('user');
    expect(result.roles).toEqual(['admin']);
    expect(result.jsonld[`${USER}hasUserRole`]).toEqual([{ '@id': `${ROLES}admin` }]);

    result.removeRole('admin');
    expect(result.roles).toEqual([]);
    expect(result.jsonld[`${USER}hasUserRole`]).toBeUndefined();
  });
});
