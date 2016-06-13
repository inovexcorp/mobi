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
describe('Prop Select directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    beforeEach(function() {
        module('propSelect');
        mockOntologyManager();

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/propSelect/propSelect.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.selectedProp = '';
            scope.onChange = jasmine.createSpy('onChange');

            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });

        it('props should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([{}]);
        });
        it('onChange should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onChange();

            expect(scope.onChange).toHaveBeenCalled();
        });
        it('selectedProp should be two way bound', function() {
            var controller = this.element.controller('propSelect');
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).toEqual('test');
        });
    });
    describe('controller methods', function() {
        it('should get the name of the passed property object', function() {
            var element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
            var controller = element.controller('propSelect');
            var result = controller.getName({});
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({});
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});