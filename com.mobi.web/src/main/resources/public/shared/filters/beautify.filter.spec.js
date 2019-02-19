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
describe('Beautify filter', function() {
    var $filter;

    beforeEach(function() {
        module('shared');

        // To test out a filter, you need to inject $filter and save it to use
        // like you would normally
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
            result = $filter('beautify')(value);
            expect(result).toEqual('');
        });
    });
    it('returns an empty string when passed an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('beautify')(value);
            expect(result).toEqual('');
        });
    });
    it('returns a beautified string when passed a string', function() {
        var tests = [{
            value: 'abc',
            result: 'Abc'
        }, {
            value: 'abc.&#@_def',
            result: 'Abc.&#@_def'
        }, {
            value: 'ABC',
            result: 'ABC'
        }, {
            value: 'abc def',
            result: 'Abc def'
        }, {
            value: 'xmlHTTPRequest',
            result: 'Xml HTTP Request'
        }, {
            value: 'ThisIsAValue',
            result: 'This Is A Value'
        }, {
            value: 'Numbers2017Here',
            result: 'Numbers 2017 Here'
        }, {
            value: '123Here',
            result: '123 Here'
        }];
        _.forEach(tests, function(test) {
            result = $filter('beautify')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});