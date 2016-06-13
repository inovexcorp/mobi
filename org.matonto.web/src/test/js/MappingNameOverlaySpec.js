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
describe('Mapping Name Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc;

    beforeEach(function() {
        module('mappingNameOverlay');
        mockMappingManager();

        inject(function(_mappingManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/mappingNameOverlay/mappingNameOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.mappingName = '';
            scope.set = jasmine.createSpy('set');
            scope.close = jasmine.createSpy('close');

            this.element = $compile(angular.element('<mapping-name-overlay mapping-name="{{mappingName}}" set="set(name)" close="close()"></mapping-name-overlay>'))(scope);
            scope.$digest();
        });

        it('mappingName should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mappingName = 'test';
            scope.$digest();
            expect(scope.mappingName).not.toBe('test');
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('close should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.close();

            expect(scope.close).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-name-overlay mapping-name="{{mappingName}}" set="set(name)" close="close()"></mapping-name-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapping name input', function() {
            expect(this.element.find('mapping-name-input').length).toBe(1);
        });
        it('with custom buttons for cancel and set', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});