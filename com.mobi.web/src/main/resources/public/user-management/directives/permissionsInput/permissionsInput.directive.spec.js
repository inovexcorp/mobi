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
describe('Permissions Input directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('permissionsInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.roles = {};
        scope.isDisabledWhen = false;
        scope.onChange = jasmine.createSpy('onChange');
        this.element = $compile(angular.element('<permissions-input roles="roles" is-disabled-when="isDisabledWhen" on-change="onChange()"></permissions-input>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        })
        it('roles should be two way bound', function() {
            this.isolatedScope.roles = {admin: true};
            scope.$digest();
            expect(scope.roles).toEqual({admin: true});
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toBe(false);
        });
        it('onChange should be called in parent scope when invoked', function() {
            this.isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('permissions-input')).toBe(true);
        })
        it('with a checkbox for the admin role', function() {
            expect(this.element.querySelectorAll('checkbox[display-text="\'Admin\'"]').length).toBe(1);
        });
    });
});