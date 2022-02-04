/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { TestBed } from '@angular/core/testing';
import { forEach } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { SplitIRIPipe } from './splitIRI.pipe';

describe('Split IRI pipe', function() {
    const pipe = new SplitIRIPipe();

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [SplitIRIPipe],
            imports: []
        }).compileComponents();
    });

    it('returns the split apart iri if passed a string', function() {
        const tests = [
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
        forEach(tests, function(test) {
            const result = pipe.transform(test.value);
            expect(result).toEqual(test.result);
        });
    });
});
