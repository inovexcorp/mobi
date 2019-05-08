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
describe('Escape HTML filter', function() {
    var $filter;

    beforeEach(function() {
        module('shared');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    afterEach(function() {
        $filter = null;
    });

    it('returns an empty string when given a falsey value', function() {
        var result;
        _.forEach([false, '', 0, undefined, null], function(value) {
            result = $filter('escapeHTML')(value);
            expect(result).toEqual('');
        });
    });
    it('returns the string representation of an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('escapeHTML')(value);
            expect(result).toEqual(value.toString());
        });
    });
    it('returns a copy of the string with escaped special characters', function() {
        result = $filter('escapeHTML')('<>&');
        expect(result).toEqual('&lt;&gt;&amp;');
    });
});