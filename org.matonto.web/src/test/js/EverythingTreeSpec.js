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
describe('Everything Tree directive', function() {
    var $compile, scope, element, ontologyStateSvc, ontologyManagerSvc, controller, ontologyUtils;

    beforeEach(function() {
        module('templates');
        module('everythingTree');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtils = _ontologyUtilsManagerService_;
        });

        ontologyManagerSvc.getClasses.and.returnValue([{matonto: {originalIRI: 'class1'}}]);
        ontologyManagerSvc.getClassProperties.and.returnValue([{matonto: {originalIRI: 'property1'}}]);
        ontologyManagerSvc.getNoDomainProperties.and.returnValue([{matonto: {originalIRI: 'property1'}}]);
        ontologyManagerSvc.hasNoDomainProperties.and.returnValue(true);
        ontologyStateSvc.getOpened.and.returnValue(true);
        ontologyStateSvc.getNoDomainsOpened.and.returnValue(true);

        element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
        scope.$digest();
        controller = element.controller('everythingTree');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('tree')).toBe(true);
            expect(element.hasClass('everything-tree')).toBe(true);
        });
        it('based on container class', function() {
            expect(element.querySelectorAll('.container').length).toBe(2);
        });
        it('based on <ul>s', function() {
            expect(element.find('ul').length).toBe(4);
        });
        it('based on container tree-items', function() {
            expect(element.querySelectorAll('.container tree-item').length).toBe(2);
        });
        describe('based on tree-item length', function() {
            it('when noDomainProperties is empty', function() {
                ontologyManagerSvc.getNoDomainProperties.and.returnValue([]);
                element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
                scope.$digest();

                expect(element.querySelectorAll('.container tree-item').length).toBe(1);
            });
            it('when getClassProperties returns an empty array', function() {
                ontologyManagerSvc.getClassProperties.and.returnValue([]);
                element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
                scope.$digest();

                expect(element.querySelectorAll('.container tree-item').length).toBe(1);
            });
            it('when getClasses is empty', function() {
                ontologyManagerSvc.getClasses.and.returnValue([]);
                element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
                scope.$digest();

                expect(element.querySelectorAll('.container tree-item').length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        describe('getName calls the correct method', function() {
            it('when @id exists', function() {
                controller.getName({'@id': 'iri'});
                expect(ontologyUtils.getNameByIRI).toHaveBeenCalledWith('iri');
            });
            it('when @id does not exist', function() {
                controller.getName({matonto: {originalIRI: 'iri'}});
                expect(ontologyUtils.getNameByIRI).toHaveBeenCalledWith('iri');
            });
        });
    });
});