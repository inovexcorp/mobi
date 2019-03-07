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
describe('Permissions Input component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('user-management');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.roles = {};
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<permissions-input roles="roles" is-disabled-when="isDisabledWhen" change-event="changeEvent(value)"></permissions-input>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('permissionsInput');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('roles should be two way bound', function() {
            this.controller.roles = {admin: true};
            scope.$digest();
            expect(scope.roles).toEqual({});
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PERMISSIONS-INPUT');
            expect(this.element.querySelectorAll('.permissions-input').length).toEqual(1);
        });
        it('with a checkbox for the admin role', function() {
            expect(this.element.querySelectorAll('checkbox[display-text="\'Admin\'"]').length).toEqual(1);
        });
    });
});