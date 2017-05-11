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
describe('Explore Service', function() {
    var discoverStateSvc, datasetManagerSvc, prefixes, $q, util, scope;

    beforeEach(function() {
        module('explore');

        inject(function(exploreService, _$q_, _$httpBackend_) {
            exploreSvc = exploreService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
        });
    });
    
    // describe('getClassDetails calls the correct functions when get exploration-datasets/{id}', function() {
    //     it('is resolved', function() {
    //         var data = [{
    //             label: 'label',
    //             count: 1,
    //             examples: ['example1', 'example2'],
    //             overview: 'overview',
    //             ontologyId: 'ontologyId'
    //         }];
    //         $httpBackend.expectGET('/exploration-dataset/recordId').respond(200, data);
    //         exploreSvc.getClassDetails('recordId')
    //             .then(function(response) {
    //                 expect(response).toEqual(data);
    //             }, function() {
    //                 fail('Should have been resolved.');
    //             });
    //     });
    //     it('is rejected', function() {
    //         $httpBackend.expectGET('/exploration-dataset/recordId').respond(400, null, null, 'error');
    //         exploreSvc.getClassDetails('recordId')
    //             .then(function() {
    //                 fail('Should have been rejected.');
    //             }, function(response) {
    //                 expect(response).toBe('error');
    //             });
    //     });
    // });
});
