/*-
 * #%L
 * org.matonto.web
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
describe('Discover State Service', function() {
    var discoverStateSvc;

    beforeEach(function() {
        module('discoverState');

        inject(function(discoverStateService) {
            discoverStateSvc = discoverStateService;
        });
    });
    
    it('default variables should be set properly', function() {
        expect(discoverStateSvc.explore).toEqual({
            active: true,
            breadcrumbs: ['Classes'],
            classDetails: [],
            classId: '',
            instance: {},
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
            recordId: ''
        });
        expect(discoverStateSvc.query).toEqual({active: false});
    });
    
    it('resetPagedInstanceDetails should reset the proper variables', function() {
        discoverStateSvc.explore.instanceDetails = {
            currentPage: 1,
            data: [{prop: 'stuff'}],
            limit: 100,
            links: {
                next: 'next',
                prev: 'prev'
            },
            total: 1
        };
        discoverStateSvc.resetPagedInstanceDetails();
        expect(discoverStateSvc.explore.instanceDetails).toEqual({
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
            spyOn(discoverStateSvc, 'resetPagedInstanceDetails');
            discoverStateSvc.explore = {
                breadcrumbs: ['Classes', 'instance'],
                classDetails: [{}],
                classId: 'classId',
                instance: {'@id': 'instanceId'},
                recordId: 'recordId'
            };
        });
        it('matches the recordId', function() {
            discoverStateSvc.cleanUpOnDatasetDelete('recordId');
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes']);
            expect(discoverStateSvc.explore.classDetails).toEqual([]);
            expect(discoverStateSvc.explore.classId).toEqual('');
            expect(discoverStateSvc.explore.instance).toEqual({});
            expect(discoverStateSvc.explore.recordId).toEqual('');
            expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
        });
        it('does not match the recordId', function() {
            discoverStateSvc.cleanUpOnDatasetDelete('other');
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(discoverStateSvc.explore.classDetails).toEqual([{}]);
            expect(discoverStateSvc.explore.classId).toEqual('classId');
            expect(discoverStateSvc.explore.instance).toEqual({'@id': 'instanceId'});
            expect(discoverStateSvc.explore.recordId).toEqual('recordId');
            expect(discoverStateSvc.resetPagedInstanceDetails).not.toHaveBeenCalled();
        });
    });
    
    describe('cleanUpOnDatasetClear should reset the proper variables if the datasetIRI', function() {
        beforeEach(function() {
            spyOn(discoverStateSvc, 'resetPagedInstanceDetails');
            discoverStateSvc.explore = {
                breadcrumbs: ['Classes', 'instance'],
                classDetails: [{}],
                classId: 'classId',
                instance: {'@id': 'instanceId'},
                recordId: 'recordId'
            };
        });
        it('matches the recordId', function() {
            discoverStateSvc.cleanUpOnDatasetClear('recordId');
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes']);
            expect(discoverStateSvc.explore.classDetails).toEqual([]);
            expect(discoverStateSvc.explore.classId).toEqual('');
            expect(discoverStateSvc.explore.instance).toEqual({});
            expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
        });
        it('does not match the recordId', function() {
            discoverStateSvc.cleanUpOnDatasetClear('other');
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', 'instance']);
            expect(discoverStateSvc.explore.classDetails).toEqual([{}]);
            expect(discoverStateSvc.explore.classId).toEqual('classId');
            expect(discoverStateSvc.explore.instance).toEqual({'@id': 'instanceId'});
            expect(discoverStateSvc.resetPagedInstanceDetails).not.toHaveBeenCalled();
        });
    });
});
