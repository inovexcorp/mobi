/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
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

import { DiscoverStateService } from './discoverState.service';
import { YasguiQuery } from '../models/yasguiQuery.class';

describe('Discover State Service', function() {
    let service: DiscoverStateService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                DiscoverStateService,
            ]
        });

        service = TestBed.inject(DiscoverStateService);
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
            data: [{instanceIRI: 'stuff', title: 'stuff', description: ''}],
            limit: 100,
            links: {
                next: 'next',
                prev: 'prev'
            },
            total: 1
        };
        service.resetPagedInstanceDetails();
        expect(service.explore.instanceDetails).toEqual({
            currentPage: 0,
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
                classDeprecated: false,
                classDetails: [],
                classId: 'classId',
                creating: false,
                editing: false,
                instance: {
                    // changed: ['prop'],
                    entity: [{'@id': 'instanceId', '@type': ['instance']}],
                    metadata: {instanceIRI: 'instanceIRI', title: 'prop', description: 'prop description'},
                    objectMap: {},
                    original: []
                },
                instanceDetails: {
                    currentPage: 0,
                    data: [],
                    limit: 99,
                    total: 0,
                    links: {
                        next: '',
                        prev: ''
                    },
                },
                recordId: 'recordId',
                recordTitle: 'recordTitle',
                hasPermissionError: false
            };
        });
        it('matches the recordId', function() {
            service.cleanUpOnDatasetDelete('recordId');
            expect(service.explore.breadcrumbs).toEqual(['Classes']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('');
            expect(service.explore.instance).toEqual({entity: [], metadata: undefined, objectMap: {}, original: []});
            expect(service.explore.recordId).toEqual('');
            expect(service.resetPagedInstanceDetails).toHaveBeenCalledWith();
        });
        it('does not match the recordId', function() {
            service.cleanUpOnDatasetDelete('other');
            expect(service.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('classId');
            expect(service.explore.instance).toEqual({
                entity: [{'@id': 'instanceId', '@type': ['instance']}],
                metadata: {instanceIRI: 'instanceIRI', title: 'prop', description: 'prop description'},
                objectMap: {},
                original: []});
            expect(service.explore.recordId).toEqual('recordId');
            expect(service.resetPagedInstanceDetails).not.toHaveBeenCalled();
        });
    });
    describe('cleanUpOnDatasetClear should reset the proper variables if the datasetIRI', function() {
        beforeEach(function() {
            spyOn(service, 'resetPagedInstanceDetails');
            service.explore = {
                breadcrumbs: ['Classes', 'instance'],
                classDeprecated: false,
                classDetails: [],
                classId: 'classId',
                creating: false,
                editing: false,
                instance: {
                    // changed: ['prop'],
                    entity: [{'@id': 'instanceId', '@type': ['instance']}],
                    metadata: {instanceIRI: 'instanceIRI', title: 'prop', description: 'prop description'},
                    objectMap: {},
                    original: []
                },
                instanceDetails: {
                    currentPage: 0,
                    data: [],
                    limit: 99,
                    total: 0,
                    links: {
                        next: '',
                        prev: ''
                    },
                },
                recordId: 'recordId',
                recordTitle: 'recordTitle',
                hasPermissionError: false
            };
        });
        it('matches the recordId', function() {
            service.cleanUpOnDatasetClear('recordId');
            expect(service.explore.breadcrumbs).toEqual(['Classes']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('');
            expect(service.explore.instance).toEqual({entity: [], metadata: undefined, objectMap: {}, original: []});
            expect(service.resetPagedInstanceDetails).toHaveBeenCalledWith();
        });
        it('does not match the recordId', function() {
            service.cleanUpOnDatasetClear('other');
            expect(service.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(service.explore.classDetails).toEqual([]);
            expect(service.explore.classId).toEqual('classId');
            expect(service.explore.instance).toEqual({
                entity: [{'@id': 'instanceId', '@type': ['instance']}],
                metadata: {instanceIRI: 'instanceIRI', title: 'prop', description: 'prop description'},
                objectMap: {},
                original: []});
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
            '@id': '_:x1',
            '@type': ['https://mobi.com#classId']
        }];
        expect(service.getInstance()).toEqual({'@id': '_:x1', '@type': ['https://mobi.com#classId']});
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
                // changed: undefined,
                entity: [],
                metadata: undefined,
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            },
            recordId: '',
            recordTitle: '',
            hasPermissionError: false
        });
        expect(service.query).toEqual(new YasguiQuery());
    }
});
