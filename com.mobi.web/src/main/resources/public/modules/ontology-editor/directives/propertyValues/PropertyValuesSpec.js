/*-
 * #%L
 * com.mobi.web
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
    var $compile, scope, ontologyUtilsManagerSvc, ontologyManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('propertyValues');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyUtilsManagerService_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyManagerSvc.isBlankNodeId.and.callFake(function(string) {
            return string === '_:genid0';
        });
        scope.entity = {'prop': [{'@id': 'value1'}, {'@id': '_:genid0'}]};
        scope.property = 'prop';
        scope.edit = jasmine.createSpy('edit');
        scope.remove = jasmine.createSpy('remove');
        this.element = $compile(angular.element('<property-values property="property" entity="entity" edit="edit(property, index)" remove="remove(iri, index)"></property-values>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyUtilsManagerSvc = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('property should be one way bound', function() {
            this.isolatedScope.property = 'test';
            scope.$digest();
            expect(scope.property).toBe('prop');
        });
        it('entity should be one way bound', function() {
            var entity = angular.copy(scope.entity);
            this.isolatedScope.entity = {test: 'test'};
            scope.$digest();
            expect(scope.entity).not.toEqual({test: 'test'});
        });
        it('edit should be called in the parent scope', function() {
            this.isolatedScope.edit();
            expect(scope.edit).toHaveBeenCalled();
        });
        it('remove should be called in the parent scope', function() {
            this.isolatedScope.remove();
            expect(scope.remove).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('property-values')).toBe(true);
            expect(this.element.querySelectorAll('.value-header').length).toBe(1);
        });
        it('based on the number of values', function() {
            var values = this.element.querySelectorAll('.value-container');
            expect(values.length).toBe(2);
        });
        it('depending on whether a value is a blank node and user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var blankNodeValue = this.element.querySelectorAll('.value-container .value-display-wrapper blank-node-value-display');
            expect(blankNodeValue.length).toBe(1);
            var editButtons = this.element.querySelectorAll('.value-container [title=Edit]');
            expect(editButtons.length).toBe(1);
            var deleteButtons = this.element.querySelectorAll('.value-container [title=Delete]');
            expect(deleteButtons.length).toBe(2);
        });
        it('depending on whether a value is a blank node and user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            var blankNodeValue = this.element.querySelectorAll('.value-container .value-display-wrapper blank-node-value-display');
            expect(blankNodeValue.length).toBe(1);
            var editButtons = this.element.querySelectorAll('.value-container [title=Edit]');
            expect(editButtons.length).toBe(0);
            var deleteButtons = this.element.querySelectorAll('.value-container [title=Delete]');
            expect(deleteButtons.length).toBe(0);
        });
        it('depending on whether the values are open or closed', function() {
            var icon = angular.element(this.element.querySelectorAll('.value-header i')[0]);
            var values = this.element.querySelectorAll('.value-container');
            expect(icon.hasClass('fa-chevron-up')).toBe(true);
            _.forEach(values, function(value) {
                expect(angular.element(value).hasClass('ng-hide')).toBe(false);
            });

            this.isolatedScope.isClosed = true;
            scope.$digest();
            expect(icon.hasClass('fa-chevron-down')).toBe(true);
            _.forEach(values, function(value) {
                expect(angular.element(value).hasClass('ng-hide')).toBe(true);
            });
        });
    });
    it('should call edit when the appropriate button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        var editButton = angular.element(this.element.querySelectorAll('.value-container [title=Edit]')[0]);
        editButton.triggerHandler('click');
        expect(scope.edit).toHaveBeenCalledWith(scope.property, 0);
    });
    it('should call remove when the appropriate button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        var removeButton = angular.element(this.element.querySelectorAll('.value-container [title=Delete]')[0]);
        removeButton.triggerHandler('click');
        expect(scope.remove).toHaveBeenCalledWith(scope.property, 0);
    });
});