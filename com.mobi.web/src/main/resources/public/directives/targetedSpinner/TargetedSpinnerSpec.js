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
    var $compile, scope, httpSvc;

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

    beforeEach(function compile() {
        this.compile = function(html) {
            this.element = $compile(angular.element(html))(scope);
            scope.$digest();
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        httpSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct value for cancelOnDestroy', function() {
        this.compile('<div targeted-spinner=""></div>');
        expect(scope.cancelOnDestroy).toBe(false);

        this.compile('<div targeted-spinner="" cancel-on-destroy></div>');
        expect(scope.cancelOnDestroy).toBe(true);
    });
    it('should clean up tracker when scope is destroyed', function() {
        this.compile('<div targeted-spinner="id" cancel-on-destroy></div>');
        scope.$destroy();
        expect(httpSvc.cancel).toHaveBeenCalledWith('id');
    });
});
