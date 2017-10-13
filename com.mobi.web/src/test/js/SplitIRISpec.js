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
describe('Split IRI filter', function() {
    var $filter;

    beforeEach(function() {
        module('splitIRI');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    it('returns an object with empty string values if iri is falsey or an object', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}, []], function(value) {
            result = $filter('splitIRI')(value);
            expect(result).toEqual({begin: '', then: '', end: ''});
        });
    });
    it('returns the split apart iri if passed a string', function() {
        var results,
            tests = [
                {
                    value: 'a#a',
                    result: {
                        begin: 'a',
                        then: '#',
                        end: 'a'
                    }
                },
                {
                    value: 'a/a',
                    result: {
                        begin: 'a',
                        then: '/',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a',
                    result: {
                        begin: 'a',
                        then: ':',
                        end: 'a'
                    }
                },
                {
                    value: 'a/a/a',
                    result: {
                        begin: 'a/a',
                        then: '/',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a:a',
                    result: {
                        begin: 'a:a',
                        then: ':',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a/a:a',
                    result: {
                        begin: 'a:a/a',
                        then: ':',
                        end: 'a'
                    }  
                }
            ];
        _.forEach(tests, function(test) {
            result = $filter('splitIRI')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});