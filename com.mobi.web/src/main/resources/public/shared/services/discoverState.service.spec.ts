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
import { configureTestSuite } from 'ng-bullet';

import { DiscoverStateService } from './discoverState.service';

describe('Discover State Service', function() {
    let service: DiscoverStateService;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                DiscoverStateService,
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(DiscoverStateService);
    });

    afterEach(function() {
        service = null;
    });

    it('default variables should be set properly', function() {
        expectInitialState();
    });
    it('reset should reset all state variables', function() {
        service.reset();
        expectInitialState();
    });
    it('resetPagedInstanceDetails should reset the proper variables', function() {
        service.explore.instanceDetails = {
            currentPage: 1,
            data: [{prop: 'stuff'}],
            limit: 100,
            links: {
                next: 'next',
                prev: 'prev'
            },
            total: 1
        };
        service.resetPagedInstanceDetails();
        expect(service.explore.instanceDetails).toEqual({
            currentPage: 1,
            data: [],
            limit: 99,
            links: {
                next: '',
                prev: ''
            },
            total: 0
        });
    });
    describe('cleanUpOnDatasetDelete should reset the proper variables if the datasetIRI', function() {
        beforeEach(function() {
            spyOn(service, 'resetPagedInstanceDetails');
            service.explore = {
                breadcrumbs: ['Classes', 'instance'],
                classDetails: [{}],
                classId: 'classId',
                instance: {
                    changed: ['prop'],
                    entity: {'@id': 'instanceId'},
                    metadata: {prop: 'prop'}
                },
                recordId: 'recordId'
            };
        });
        it('matches the recordId', function() {
            service.cleanUpOnDatasetDelete('recordId');
            expect(service.explore.breadcrumbs).toEqual(['Classes']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('');
            expect(service.explore.instance).toEqual({changed: [], entity: {}, metadata: {}});
            expect(service.explore.recordId).toEqual('');
            expect(service.resetPagedInstanceDetails).toHaveBeenCalledWith();
        });
        it('does not match the recordId', function() {
            service.cleanUpOnDatasetDelete('other');
            expect(service.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(service.explore.classDetails).toEqual([{}]);
            expect(service.explore.classId).toEqual('classId');
            expect(service.explore.instance).toEqual({changed: ['prop'], entity: {'@id': 'instanceId'}, metadata: {prop: 'prop'}});
            expect(service.explore.recordId).toEqual('recordId');
            expect(service.resetPagedInstanceDetails).not.toHaveBeenCalled();
        });
    });
    describe('cleanUpOnDatasetClear should reset the proper variables if the datasetIRI', function() {
        beforeEach(function() {
            spyOn(service, 'resetPagedInstanceDetails');
            service.explore = {
                breadcrumbs: ['Classes', 'instance'],
                classDetails: [{}],
                classId: 'classId',
                instance: {
                    changed: ['prop'],
                    entity: {'@id': 'instanceId'},
                    metadata: {prop: 'prop'}
                },
                recordId: 'recordId'
            };
        });
        it('matches the recordId', function() {
            service.cleanUpOnDatasetClear('recordId');
            expect(service.explore.breadcrumbs).toEqual(['Classes']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('');
            expect(service.explore.instance).toEqual({changed: [], entity: {}, metadata: {}});
            expect(service.resetPagedInstanceDetails).toHaveBeenCalledWith();
        });
        it('does not match the recordId', function() {
            service.cleanUpOnDatasetClear('other');
            expect(service.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(service.explore.classDetails).toEqual([{}]);
            expect(service.explore.classId).toEqual('classId');
            expect(service.explore.instance).toEqual({changed: ['prop'], entity: {'@id': 'instanceId'}, metadata: {prop: 'prop'}});
            expect(service.resetPagedInstanceDetails).not.toHaveBeenCalled();
        });
    });
    it('clickCrumb should navigate to the selected crumb', function() {
        service.explore.breadcrumbs = ['', ''];
        service.explore.editing = true;
        service.explore.creating = true;
        service.clickCrumb(0);
        expect(service.explore.breadcrumbs.length).toBe(1);
        expect(service.explore.editing).toBe(false);
        expect(service.explore.creating).toBe(false);
    });
    it('getInstance should return the correct object in the entity', function() {
        service.explore.classId = 'https://mobi.com#classId';
        service.explore.instance.entity = [{
            '@type': ['https://mobi.com#classId']
        }, {
            '@id': '_:x1'
        }];
        expect(service.getInstance()).toEqual({'@type': ['https://mobi.com#classId']});
    });
    it('resetSearchQueryConfig should reset the query config variables', function() {
        service.search.queryConfig = {
            isOrKeywords: true,
            isOrTypes: true,
            keywords: ['keyword'],
            types: ['type'],
            filters: [{
                prop: 'filter'
            }],
            variables: {
                var0: 'var0'
            }
        };
        service.resetSearchQueryConfig();
        expect(service.search.queryConfig).toEqual({
            isOrKeywords: false,
            isOrTypes: false,
            keywords: [],
            types: [],
            filters: [],
            variables: {
                var0: 'var0'
            }
        });
    });

    function expectInitialState() {
        expect(service.explore).toEqual({
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                changed: [],
                entity: [{}],
                metadata: {},
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 1,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            },
            recordId: '',
            hasPermissionError: false
        });
        expect(service.search).toEqual({
            datasetRecordId: '',
            noDomains: undefined,
            properties: undefined,
            queryConfig: {
                isOrKeywords: false,
                isOrTypes: false,
                keywords: [],
                types: [],
                filters: [],
                variables: {}
            },
            results: undefined,
            targetedId: 'discover-search-results',
            typeObject: undefined
        });
        expect(service.query).toEqual({
            datasetRecordId: '',
            submitDisabled: false,
            queryString: '',
            response: {},
            selectedPlugin: '',
            executionTime: 0
        });
    }
});
