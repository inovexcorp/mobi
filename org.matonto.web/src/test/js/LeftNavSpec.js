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
describe('Left Nav directive', function() {
    var $compile,
        scope,
        windowSvc;

    beforeEach(function() {
        module('templates');
        module('leftNav');
        module(function($provide) {
            $provide.service('$window', function() {
                this.open = jasmine.createSpy('open');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            windowSvc = _$window_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.moduleName = '';
            scope.docUrl = '';

            this.element = $compile(angular.element('<left-nav module-name="{{moduleName}}" doc-url="{{docUrl}}"></left-nav>'))(scope);
            scope.$digest();
        });
        it('moduleName should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.moduleName = 'name';
            scope.$digest();
            expect(scope.moduleName).not.toBe('name');
        });
        it('docUrl should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.docUrl = 'url';
            scope.$digest();
            expect(scope.docUrl).not.toBe('url');
        });
    });
    describe('scope methods', function() {
        it('open the passed in doc url', function() {
            scope.docUrl = '';
            var element = $compile(angular.element('<left-nav module-name="{{moduleName}}" doc-url="{{docUrl}}"></left-nav>'))(scope);
            scope.$digest();
            var isolatedScope = element.isolateScope();
            isolatedScope.openDocs();
            expect(windowSvc.open).toHaveBeenCalledWith(scope.docUrl);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<left-nav module-name="{{moduleName}}" doc-url="{{docUrl}}"></left-nav>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('left-nav')).toBe(true);
            expect(this.element.hasClass('nav')).toBe(true);
            expect(this.element.hasClass('full-height')).toBe(true);
        });
        it('with a leftNavItem to open the doc url', function() {
            var item = this.element.find('left-nav-item');
            expect(item.length).toBe(1);
            expect(item.hasClass('doc-link')).toBe(true);
        });
    });
});