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
    var $compile, scope, element, isolatedScope, controller, ontologyManagerSvc, splitIRI;

    beforeEach(function() {
        module('templates');
        module('propSelect');
        mockOntologyManager();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRI = _splitIRIFilter_;
        });

        scope.props = [];
        scope.isDisabledWhen = false;
        scope.selectedProp = undefined;
        scope.onChange = jasmine.createSpy('onChange');
        element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" is-disabled-when="isDisabledWhen" on-change="onChange()"></prop-select>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('propSelect');
    });
    describe('in isolated scope', function() {
        it('props should be one way bound', function() {
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([]);
        });
        it('isDisabledWhen should be one way bound', function() {
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('onChange should be called in the parent scope', function() {
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('selectedProp should be two way bound', function() {
            controller.selectedProp = {};
            scope.$digest();
            expect(scope.selectedProp).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should get the ontology id of a prop', function() {
            expect(controller.getOntologyId({ontologyId: 'test'})).toBe('test');
            expect(splitIRI).not.toHaveBeenCalled();

            splitIRI.and.returnValue({begin: 'test'});
            expect(controller.getOntologyId({propObj: {'@id': ''}})).toBe('test');
            expect(splitIRI).toHaveBeenCalledWith('');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('prop-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
    });
});