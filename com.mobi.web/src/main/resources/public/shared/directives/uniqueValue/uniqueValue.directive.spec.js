/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Unique Value directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('uniqueValue');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.list = [];
        scope.value = '';
        this.element = $compile(angular.element('<form name="exampleForm"><input unique-value="list" ng-model="value" /></form>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('should set the correct validity state', function() {
        it('if the value is empty', function() {
            expect(scope.exampleForm.$invalid).toBe(false);
        });
        it('if the value is not contained within the passed list', function() {
            scope.value = 'test';
            scope.$digest();
            expect(scope.exampleForm.$invalid).toBe(false);
        });
        it('if the value is contained within the passed list', function() {
            scope.value = 'test';
            scope.list = ['test'];
            scope.$digest();
            expect(scope.exampleForm.$invalid).toBe(true);
        });
    });
});