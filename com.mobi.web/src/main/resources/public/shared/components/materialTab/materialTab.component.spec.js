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
describe('Material Tab component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.active = true;
        scope.hideTab = false;
        scope.heading = '';
        scope.onClick = jasmine.createSpy('onClick');
        scope.setActive = jasmine.createSpy('setActive');
        var parent = angular.element('<div><material-tab active="active" heading="heading" hide-tab="hideTab" on-click="onClick()" set-active="setActive(value)"></material-tab></div>');
        parent.data('$materialTabsetController', {
            addTab: jasmine.createSpy('addTab'),
            removeTab: jasmine.createSpy('removeTab')
        });
        this.parentElement = $compile(parent)(scope);
        scope.$digest();
        this.element = angular.element(this.parentElement.children()[0]);
        this.controller = this.element.controller('materialTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.parentElement.remove();
    });

    describe('controller bound variable', function() {
        it('active should be one way bound', function() {
            this.controller.active = false;
            scope.$digest();
            expect(scope.active).toEqual(true);
        });
        it('heading should be one way bound', function() {
            this.controller.heading = 'new';
            scope.$digest();
            expect(scope.heading).toEqual('');
        });
        it('hideTab should be one way bound', function() {
            this.controller.hideTab = true;
            scope.$digest();
            expect(scope.hideTab).toEqual(false);
        });
        it('onClick should be called in parent scope', function() {
            this.controller.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
        it('setActive should be called in parent scope', function() {
            this.controller.setActive({value: true});
            expect(scope.setActive).toHaveBeenCalledWith(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MATERIAL-TAB');
        });
        it('depending on whether the tab is active', function() {
            expect(this.element.querySelectorAll('.material-tab').length).toEqual(1);
            
            this.controller.active = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.material-tab').length).toEqual(0);
        });
    });
});
