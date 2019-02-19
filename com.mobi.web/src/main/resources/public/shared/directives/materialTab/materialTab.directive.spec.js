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
describe('Material Tab directive', function() {
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
        var parent = angular.element('<div><material-tab active="active" heading="heading" hide-tab="hideTab" on-click="onClick()"></material-tab></div>');
        parent.data('$materialTabsetController', {
            addTab: jasmine.createSpy('addTab'),
            removeTab: jasmine.createSpy('removeTab')
        });
        this.element = $compile(parent)(scope);
        scope.$digest();
        this.elementSansWrapper = angular.element(this.element.children()[0]);
        this.isolatedScope = this.elementSansWrapper.scope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        // TODO: Figure out how to do this test at some point
        /*it('active should be two way bound', function() {
            this.isolatedScope.active = false;
            scope.$digest();
            expect(scope.active).toEqual(false);
        });*/
        it('heading should be one way bound', function() {
            this.isolatedScope.heading = 'new';
            scope.$digest();
            expect(scope.heading).toEqual('');
        });
        it('hideTab should be one way bound', function() {
            this.isolatedScope.hideTab = true;
            scope.$digest();
            expect(scope.hideTab).toEqual(false);
        });
        it('onClick should be called in parent scope when invoked', function() {
            this.isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.elementSansWrapper.hasClass('material-tab')).toBe(true);
        });
    });
});
