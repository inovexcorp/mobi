/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import { CamelCasePipe } from './camelCase.pipe';

describe('Camel Case pipe', function() {
    const pipe = new CamelCasePipe();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CamelCasePipe],
            imports: []
        }).compileComponents();
    });

    it('returns a class-wise camel case string when passed a string and type "class"', function() {
        const tests = [
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
            },
            {
                value: '`abcdef',
                result: 'abcdef'
            }
        ];
        forEach(tests, function(test) {
            const result = pipe.transform(test.value, 'class');
            expect(result).toEqual(test.result);
        });
    });
    it('returns a general camel case string when passed a string and not type', function() {
        const tests = [
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
        forEach(tests, function(test) {
            const result = pipe.transform(test.value);
            expect(result).toEqual(test.result);
        });
    });
});
