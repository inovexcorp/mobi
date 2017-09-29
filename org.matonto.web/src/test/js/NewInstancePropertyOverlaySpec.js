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
describe('New Instance Property Overlay directive', function() {
    var $compile, scope, element, discoverStateSvc, isolatedScope, util;

    beforeEach(function() {
        module('templates');
        module('newInstancePropertyOverlay');
        mockDiscoverState();
        mockUtil();

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            util = _utilService_;
        });
        scope.onCancel = jasmine.createSpy('onCancel');
        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.getProperties = jasmine.createSpy('getProperties');
        element = $compile(angular.element('<new-instance-property-overlay on-cancel="onCancel()" on-submit="onSubmit()" get-properties="getProperties()"></new-instance-property-overlay>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
    });
    
    describe('controller bound variables', function() {
        it('onCancel should be called in parent scope when invoked', function() {
            isolatedScope.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
        });
        it('onSubmit should be called in parent scope when invoked', function() {
            isolatedScope.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
        it('getProperties should be called in parent scope when invoked', function() {
            isolatedScope.getProperties();
            expect(scope.getProperties).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('new-instance-property-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('for a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('for a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('for a .main', function() {
            expect(element.querySelectorAll('.main').length).toBe(1);
        });
        it('for a p', function() {
            expect(element.find('p').length).toBe(1);
        });
        it('for md-autocomplete', function() {
            expect(element.find('md-autocomplete').length).toBe(1);
        });
        it('for a .btn-container.clearfix', function() {
            expect(element.querySelectorAll('.btn-container.clearfix').length).toBe(1);
        });
        it('for a .btn.btn-primary', function() {
            expect(element.querySelectorAll('.btn.btn-primary').length).toBe(1);
        });
        it('for a .btn.btn-default', function() {
            expect(element.querySelectorAll('.btn.btn-default').length).toBe(1);
        });
    });
});