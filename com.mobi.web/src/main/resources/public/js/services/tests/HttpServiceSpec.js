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
describe('Http service', function() {
    var httpSvc, $http, $q;

    beforeEach(function() {
        module('httpService');

        inject(function(httpService, _$http_, _$q_) {
            httpSvc = httpService;
            $http = _$http_;
            $q = _$q_;
        });
    });

    describe('isPending should return', function() {
        it('true if id exists in pending array', function() {
            httpSvc.pending = [{
                id: 'id'
            }];
            expect(httpSvc.isPending('id')).toBe(true);
        });
        it('false if id does not exist in pending array', function() {
            expect(httpSvc.isPending('id')).toBe(false);
        });
    });

    describe('cancel should resolve the correct canceller', function() {
        var resolve;
        beforeEach(function() {
            resolve = jasmine.createSpy('resolve');
            httpSvc.pending = [{
                id: 'id',
                canceller: {
                    resolve: resolve
                }
            }];
        });
        it('if id is present', function() {
            spyOn(httpSvc, 'isPending').and.returnValue(true);
            httpSvc.cancel('id', false);
            expect(resolve).toHaveBeenCalled();
        });
        it('if id is not present', function() {
            spyOn(httpSvc, 'isPending').and.returnValue(false);
            httpSvc.cancel('not-there');
            expect(resolve).not.toHaveBeenCalled();
        });
    });

    describe('get should call the correct methods when id', function() {
        beforeEach(function() {
            spyOn($http, 'get').and.callThrough();
            spyOn($q, 'defer').and.returnValue({resolve: 'different'});
        });
        it('exists in the pending array', function() {
            httpSvc.pending = [{
                id: 'id',
                canceller: {
                    resolve: jasmine.createSpy('resolve')
                }
            }];
            httpSvc.get('url', {prop: 'prop'}, 'id');
            expect($http.get).toHaveBeenCalledWith('url', jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(2);
            expect(httpSvc.pending[1].canceller).toEqual({resolve: 'different'});
        });
        it('does not exist in the pending array', function() {
            httpSvc.get('url', {prop: 'prop'}, 'id');
            expect($http.get).toHaveBeenCalledWith('url', jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(1);
            expect(httpSvc.pending[0].canceller).toEqual({resolve: 'different'});
        });
    });
});
