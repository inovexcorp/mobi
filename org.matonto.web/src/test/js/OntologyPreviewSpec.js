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
describe('Ontology Preview directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('ontologyPreview');
        mockPrefixes();
        mockOntologyManager();
        
        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            scope.ontology = {};
            this.element = $compile(angular.element('<ontology-preview ontology="ontology"></ontology-preview>'))(scope);
            scope.$digest();
            controller = this.element.controller('ontologyPreview');
        });
        it('ontology should be one way bound', function() {
            controller.ontology = {id: ''};
            scope.$digest();
            expect(scope.ontology).not.toEqual({id: ''});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.ontology = [{id: '', entities: []}];
            ontologyManagerSvc.getClasses.and.returnValue(_.fill(Array(6), {'@type': ['Class']}));
            this.element = $compile(angular.element('<ontology-preview ontology="ontology"></ontology-preview>'))(scope);
            scope.$digest();
            controller = this.element.controller('ontologyPreview');
        });
        it('should create an ontology title', function() {
            var result = controller.createTitle();
            expect(ontologyManagerSvc.getOntologyEntity).toHaveBeenCalledWith(controller.ontology.entities);
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should create a description of the ontology', function() {
            var result = controller.createDescription();
            expect(ontologyManagerSvc.getOntologyEntity).toHaveBeenCalledWith(controller.ontology.entities);
            expect(typeof result).toBe('string');
        });
        it('should get classes from the ontology', function() {
            var result = controller.getClasses();
            expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith(controller.ontology.entities);
            expect(Array.isArray(result)).toBe(true);
        });
        describe('should get the list of classes to display', function() {
            beforeEach(function() {
                ontologyManagerSvc.getEntityName.calls.reset();
            });
            it('if the list is full', function() {
                controller.full = true;
                var result = controller.getClassList();
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(ontologyManagerSvc.getClasses().length);
                expect(ontologyManagerSvc.getEntityName.calls.count()).toBe(ontologyManagerSvc.getClasses().length);
            });
            it('if the list if not full', function() {
                controller.full = false;
                var result = controller.getClassList();
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(controller.numClassPreview);
                expect(ontologyManagerSvc.getEntityName.calls.count()).toBe(controller.numClassPreview);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<ontology-preview ontology="ontology"></ontology-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-preview')).toBe(true);
        });
        it('depending on whether the ontology was passed', function() {
            expect(this.element.children().length).toBe(0);

            scope.ontology = {};
            scope.$digest();
            expect(this.element.children().length).toBe(1);
        });
        it('depending on the length of the class list', function() {
            controller = this.element.controller('ontologyPreview');
            scope.ontology = {};
            scope.$digest();
            expect(this.element.querySelectorAll('a.header-link').length).toBe(0);
            expect(this.element.querySelectorAll('.classes')[0].innerHTML).toContain('None');

            ontologyManagerSvc.getClasses.and.returnValue(_.fill(Array(6), {'@type': ['Class']}));
            scope.$digest();
            expect(this.element.querySelectorAll('a.header-link').length).toBe(1);
            expect(this.element.querySelectorAll('.classes')[0].innerHTML).not.toContain('None');
        });
        it('depending on how many classes are showing', function() {
            controller = this.element.controller('ontologyPreview');
            scope.ontology = {};
            ontologyManagerSvc.getClasses.and.returnValue(_.fill(Array(6), {'@type': ['Class']}));
            scope.$digest();
            var link = angular.element(this.element.querySelectorAll('a.header-link')[0]);
            expect(link.text()).toBe('See More');

            controller.full = true;
            scope.$digest();
            expect(link.text()).toBe('See Less');
        });
        it('with the correct number of list items for classes', function() {
            controller = this.element.controller('ontologyPreview');
            scope.ontology = {};
            ontologyManagerSvc.getClasses.and.returnValue(_.fill(Array(5), {'@type': ['Class']}));
            scope.$digest();
            expect(this.element.querySelectorAll('.classes li').length).toBe(ontologyManagerSvc.getClasses().length);
        });
    });
    it('sets full on click of link', function() {
        scope.ontology = {};
        ontologyManagerSvc.getClasses.and.returnValue(_.fill(Array(6), {'@type': ['Class']}));
        var element = $compile(angular.element('<ontology-preview ontology="ontology"></ontology-preview>'))(scope);
        scope.$digest();
        controller = element.controller('ontologyPreview');
        
        angular.element(element.querySelectorAll('a.header-link')[0]).triggerHandler('click');
        expect(controller.full).toBe(true);
    });
});