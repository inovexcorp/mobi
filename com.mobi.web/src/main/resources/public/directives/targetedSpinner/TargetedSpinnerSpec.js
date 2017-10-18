/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Targeted Spinner directive', function() {
    var $compile, scope, element, canceller, httpSvc;

    beforeEach(function() {
        module('targetedSpinner');
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _httpService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            httpSvc = _httpService_;
        });

        httpSvc.pending = [];
        scope.id = 'id';
    });

    it('should initialize with the correct value for cancelOnDestroy', function() {
        element = $compile(angular.element('<div targeted-spinner=""></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(false);

        element = $compile(angular.element('<div targeted-spinner="" cancel-on-destroy></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(true);
    });
    it('should clean up tracker when scope is destroyed', function() {
        element = $compile(angular.element('<div targeted-spinner="id" cancel-on-destroy></div>'))(scope);
        scope.$digest();
        scope.$destroy();
        expect(httpSvc.cancel).toHaveBeenCalledWith('id');
    });
});
