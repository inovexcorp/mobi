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
describe('Property Values directive', function() {
    var $compile, scope, element, isolatedScope, resObj, ontologyUtilsManagerSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyValues');
        injectTrustedFilter();
        injectBeautifyFilter();
        mockResponseObj();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _responseObj_, _ontologyUtilsManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            resObj = _responseObj_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        ontologyManagerSvc.isBlankNodeId.and.callFake(function(string) {
            return string === '_:genid0';
        });
        scope.entity = {'prop': [{'@id': 'value1'}, {'@id': '_:genid0'}]};
        scope.property = 'prop';
        scope.edit = jasmine.createSpy('edit');
        scope.remove = jasmine.createSpy('remove');
        element = $compile(angular.element('<property-values property="property" entity="entity" edit="edit(property, index)" remove="remove(iri, index)"></property-values>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
    });

    describe('in isolated scope', function() {
        it('property should be one way bound', function() {
            isolatedScope.property = 'test';
            scope.$digest();
            expect(scope.property).toBe('prop');
        });
        it('entity should be one way bound', function() {
            var entity = angular.copy(scope.entity);
            isolatedScope.entity = {test: 'test'};
            scope.$digest();
            expect(scope.entity).not.toEqual({test: 'test'});
        });
        it('edit should be called in the parent scope', function() {
            isolatedScope.edit();
            expect(scope.edit).toHaveBeenCalled();
        });
        it('remove should be called in the parent scope', function() {
            isolatedScope.remove();
            expect(scope.remove).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('property-values')).toBe(true);
        });
        it('based on the number of values', function() {
            var values = element.querySelectorAll('.value-container');
            expect(values.length).toBe(2);
        });
        it('depending on whether a value is a blank node', function() {
            var blankNodeValue = element.querySelectorAll('.value-container .value-display-wrapper blank-node-value-display');
            expect(blankNodeValue.length).toBe(1);
            var editButtons = element.querySelectorAll('.value-container [title=Edit]');
            expect(editButtons.length).toBe(1);
            var deleteButtons = element.querySelectorAll('.value-container [title=Delete]');
            expect(deleteButtons.length).toBe(2);
        });
        it('depending on whether the values are open or closed', function() {
            var isolatedScope = element.isolateScope();
            var icon = angular.element(element.querySelectorAll('h5 i')[0]);
            var values = element.querySelectorAll('.value-container');
            expect(icon.hasClass('fa-chevron-up')).toBe(true);
            _.forEach(values, function(value) {
                expect(angular.element(value).hasClass('ng-hide')).toBe(false);
            });

            isolatedScope.isClosed = true;
            scope.$digest();
            expect(icon.hasClass('fa-chevron-down')).toBe(true);
            _.forEach(values, function(value) {
                expect(angular.element(value).hasClass('ng-hide')).toBe(true);
            });
        });
    });
    it('should call edit when the appropriate button is clicked', function() {
        resObj.createItemFromIri.and.returnValue({});
        var editButton = angular.element(element.querySelectorAll('.value-container [title=Edit]')[0]);
        editButton.triggerHandler('click');
        expect(resObj.createItemFromIri).toHaveBeenCalledWith(scope.property);
        expect(scope.edit).toHaveBeenCalledWith({}, 0);
    });
    it('should call remove when the appropriate button is clicked', function() {
        var removeButton = angular.element(element.querySelectorAll('.value-container [title=Delete]')[0]);
        removeButton.triggerHandler('click');
        expect(scope.remove).toHaveBeenCalledWith(scope.property, 0);
    });
});