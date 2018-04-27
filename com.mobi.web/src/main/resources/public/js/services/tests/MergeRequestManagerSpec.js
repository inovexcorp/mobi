/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Merge Request Manager service', function() {
    var mergeRequestManagerSvc, $httpBackend, $httpParamSerializer, ontologyManagerSvc, utilSvc, uuidSvc, prefixes, splitIRI, camelCase, $q, scope;

    beforeEach(function() {
        module('mergeRequestManager');
        mockPrefixes();
        mockUtil();
        injectRestPathConstant();

        inject(function(mergeRequestManagerService, _utilService_, _$httpBackend_, _$httpParamSerializer_, _prefixes_, _$q_, _$rootScope_) {
            mergeRequestManagerSvc = mergeRequestManagerService;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            prefixes = _prefixes_;
            $q = _$q_;
            scope = _$rootScope_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        mergeRequestManagerSvc = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
        prefixes = null;
        $q = null;
        scope = null;
    });

    describe('should get a list of merge requests', function() {
        beforeEach(function() {
            this.params = {};
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/merge-requests').respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.getRequests(this.params)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('without parameters', function() {
          $httpBackend.expectGET('/mobirest/merge-requests').respond(200, []);
          mergeRequestManagerSvc.getRequests(this.params)
              .then(function(response) {
                  expect(response).toEqual([]);
              }, function(response) {
                  fail('Promise should have resolved');
              });
          flushAndVerify($httpBackend);
        });
        it('with parameters', function() {
            this.params.accepted = false;
            this.params.ascending = false;
            this.params.sort = 'sort';
            $httpBackend.expectGET('/mobirest/merge-requests?' + $httpParamSerializer(this.params)).respond(200, []);
            mergeRequestManagerSvc.getRequests(this.params)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
