/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Remove IRI From Array filter', function() {
    var $filter;

    beforeEach(function() {
        module('inArray');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    afterEach(function() {
        $filter = null;
    });

    it('returns an empty array if passed value is not an array', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}], function(value) {
            result = $filter('inArray')(value, []);
            expect(result).toEqual([]);
        });
    });
    it('returns an empty array if array filter is not an array', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}], function(value) {
            result = $filter('inArray')([], value);
            expect(result).toEqual([]);
        });
    });
    it('returns the intersection of the passed in array and the array filter', function() {
        var result,
            tests = [
            {
                arr: [''],
                filter: [],
                result: []
            },
            {
                arr: [],
                filter: [''],
                result: []
            },
            {
                arr: ['a', 'b'],
                filter: ['a'],
                result: ['a']
            },
            {
                arr: ['a'],
                filter: ['a', 'b'],
                result: ['a']
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('inArray')(test.arr, test.filter);
            expect(result).toEqual(test.result);
        });
    });
});