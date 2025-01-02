/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { isEqual } from 'lodash';

import { UpdateRefsService } from './updateRefs.service';

describe('Update Refs service', function() {
    let service: UpdateRefsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ ],
            providers: [
                UpdateRefsService,
            ]
        });

        service = TestBed.inject(UpdateRefsService);
    });

    it('should replace all instances of a key in an object with the new key', function() {
        const obj = {
            'test/0': 0,
            'id': 'test/0',
            props: [
                {
                    'test/0': 1
                }
            ],
            refs: ['test/0'],
            items: [
                {
                    iri: 'test/0',
                    namespace: 'test/',
                    localName: '0'
                }
            ],
            test: {
                'test/0': 'something'
            }
        };
        const result = {
            'aaa/1': 0,
            'id': 'aaa/1',
            props: [
                {
                    'aaa/1': 1
                }
            ],
            refs: ['aaa/1'],
            items: [
                {
                    iri: 'aaa/1',
                    namespace: 'test/',
                    localName: '0'
                }
            ],
            test: {
                'aaa/1': 'something'
            }
        };
        service.update(obj, 'test/0', 'aaa/1');
        expect(isEqual(obj , result )).toBeTrue();
    });
    it('should replace all nested instances of a key in an object with the new key.', function() {
        const obj = {
            'test/0': {
                'test/0': {
                    'label': 'label',
                    'ontologyIri': 'test/0'
                }
            },
            'id': 'test/0',
            props: [
                {
                    'test/0': 1
                }
            ],
            refs: ['test/0'],
            items: [
                {
                    iri: 'test/0',
                    namespace: 'test/',
                    localName: '0'
                }
            ]
        };
        const result = {
            'aaa/1': {
                'aaa/1': {
                    'label': 'label',
                    'ontologyIri': 'aaa/1'
                }
            },
            'id': 'aaa/1',
            props: [
                {
                    'aaa/1': 1
                }
            ],
            refs: ['aaa/1'],
            items: [
                {
                    iri: 'aaa/1',
                    namespace: 'test/',
                    localName: '0'
                }
            ]
        };
        service.update(obj, 'test/0', 'aaa/1');
        expect(isEqual(obj , result )).toBeTrue();
    });
    it('should remove all objects that reference the provided string', function() {
        const obj = {
            'id1': 'remove',
            arr: [
                {
                    'id2': 'remove'
                }
            ],
            arr2: [
                {
                    'id3': 'remove',
                    '$$hashKey': true
                },
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['remove', 'no-remove'],
            arr4: ['remove'],
            'id5': {
                'id6': 'remove',
                '$$hashKey': true
            }
        };
        const result = {
            arr2: [
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['no-remove']
        };
        service.remove(obj, 'remove');
        expect(isEqual(obj , result)).toBeTrue();
    });
});
