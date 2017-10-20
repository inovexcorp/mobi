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
describe('Camel Case filter', function() {
    var $filter;

    beforeEach(function() {
        module('camelCase');

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
            result = $filter('camelCase')(value);
            expect(result).toEqual('');
            result = $filter('camelCase')(value, 'class');
            expect(result).toEqual('');
        });
    });
    it('returns an empty string when passed an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('camelCase')(value);
            expect(result).toEqual('');
            result = $filter('camelCase')(value, 'class');
            expect(result).toEqual('');
        });
    });
    it('returns a class-wise camel case string when passed a string and type "class"', function() {
        var tests = [
            {
                value: 'abc',
                result: 'Abc'
            },
            {
                value: 'abc.&#@_def',
                result: 'Abcdef'
            },
            {
                value: 'ABC',
                result: 'ABC'
            },
            {
                value: 'abc def',
                result: 'AbcDef'
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('camelCase')(test.value, 'class');
            expect(result).toEqual(test.result);
        });
    });
    it('returns a general camel case string when passed a string and not type', function() {
        var tests = [
            {
                value: 'abc',
                result: 'abc'
            },
            {
                value: 'abc.&#@_def',
                result: 'abcdef'
            },
            {
                value: 'ABC',
                result: 'aBC'
            },
            {
                value: 'abc def',
                result: 'abcDef'
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('camelCase')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});