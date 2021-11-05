/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { HelperService } from './helper.service';

describe('Helper service', function() {
    let service: HelperService;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                HelperService
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(HelperService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
    });

    describe('should create HttpParams from an object', function() {
        it('with string values', function() {
            const obj = {
                param1: 'a',
                param2: 'b'
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toEqual('a');
            expect(result.get('param2')).toEqual('b');
        });
        it('with non string values', function() {
            const obj = {
                param1: 10,
                param2: false
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toEqual('10');
            expect(result.get('param2')).toEqual('false');
        });
        it('with string array values', function() {
            const obj = {
                param1: ['a', 'b']
            };
            const result = service.createHttpParams(obj);
            expect(result.getAll('param1')).toEqual(['a', 'b']);
        });
        it('with non string array values', function() {
            const obj = {
                param1: [10, 15]
            };
            const result = service.createHttpParams(obj);
            expect(result.getAll('param1')).toEqual(['10', '15']);
        });
        it('with undefined, null, or empty string values', function() {
            const obj = {
                param1: undefined,
                param2: null,
                param3: ''
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toBeNull();
            expect(result.get('param2')).toBeNull();
            expect(result.get('param3')).toBeNull();
        });
    });
});
