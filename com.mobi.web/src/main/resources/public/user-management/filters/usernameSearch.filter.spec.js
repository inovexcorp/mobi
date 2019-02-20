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
describe('Username Search filter', function() {
    var $filter;
    var user1 = {username: 'testUsername', firstName: 'testFirstName', lastName: 'testLastName'};
    var user2 = {username: 'seconduser', firstName: 'secondfirst', lastName: 'secondlast'};
    var user3 = {username: 'thirduser', firstName: 'no', lastName: ''};
    var user4 = {username: 'fourthuser', firstName: '', lastName: 'onlylast'};
    var users = [user1, user2, user3, user4];

    beforeEach(function() {
        module('usernameSearch');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    it('returns all users when search string is empty', function() {
        var result;
        result = $filter('usernameSearch')(users, '');
        expect(result).toEqual(users);
    });
    it('returns all users when search string does not exist', function() {
        var result;
        result = $filter('usernameSearch')(users);
        expect(result).toEqual(users);
    });
    it('returns no users when search string does not match any users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'thisstringdoesnotmatch');
        expect(result).toEqual([]);
    });
    it('returns all users when search string matches all users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'user');
        expect(result).toEqual(users);
    });
    it('returns one user when search string matches only first name', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches only last name', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testLast');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches only username', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testuser');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches firstName lastName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'FirstName testLast');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches lastName firstName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LastName testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches lastName, firstName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LastName, testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches but casing is different', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LaStNaMe TeStFiRsT');
        expect(result).toEqual([user1]);
    });
    it('returns two of four users when search string matches two users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'first');
        expect(result).toEqual([user1, user2]);
    });
});