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
describe('Individual Tree directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc,
        settingsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('individualTree');
        mockOntologyManager();
        mockStateManager();
        mockSettingsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_, _settingsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            settingsManagerSvc = _settingsManagerService_;
        });

        ontologyManagerSvc.list = [{
            id: '',
            ontology: [{}]
        }];
        ontologyManagerSvc.getClasses.and.returnValue(['class1']);
        ontologyManagerSvc.getClassIndividuals.and.returnValue(['individual1']);
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('tree')).toBe(true);
        });
        it('depending on the number of ontologies', function() {
            var ontologies = element.querySelectorAll('ul.ontology');
            var treeItems = element.querySelectorAll('ul.ontology > tree-item');
            expect(ontologies.length).toBe(ontologyManagerSvc.list.length);
            expect(treeItems.length).toBe(ontologyManagerSvc.list.length);
        });
        it('depending on the number of classes', function() {
            var classes = element.querySelectorAll('ul.class');
            var links = element.querySelectorAll('ul.class > li a');
            expect(classes.length).toBe(ontologyManagerSvc.getClasses().length);
            expect(links.length).toBe(ontologyManagerSvc.getClasses().length);
        });
        it('depending on the number of individuals', function() {
            var individuals = element.querySelectorAll('ul.individual');
            var treeItems = element.querySelectorAll('ul.individual > tree-item');
            expect(individuals.length).toBe(ontologyManagerSvc.getClassIndividuals().length);
            expect(treeItems.length).toBe(ontologyManagerSvc.getClassIndividuals().length);
        });
        it('depending on whether an ontology is open', function() {
            var container = angular.element(element.querySelectorAll('ul.ontology > .container')[0]);
            expect(container.hasClass('ng-hide')).toBe(true);

            stateManagerSvc.getOpened.and.returnValue(true);
            scope.$digest();
            expect(container.hasClass('ng-hide')).toBe(false);
        });
        it('depending on whether the individuals of a class are open', function() {
            var container = angular.element(element.querySelectorAll('ul.class > .container')[0]);
            var icon = angular.element(element.querySelectorAll('ul.class > li a i')[0]);
            expect(container.hasClass('ng-hide')).toBe(true);
            expect(icon.hasClass('fa-folder-o')).toBe(true);

            stateManagerSvc.getIndividualsOpened.and.returnValue(true);
            scope.$digest();
            expect(container.hasClass('ng-hide')).toBe(false);
            expect(icon.hasClass('fa-folder-open-o')).toBe(true);
        });
        it('depending on whether individuals exist with a class', function() {
            var icon = angular.element(element.querySelectorAll('ul.class > li a i')[0]);
            expect(icon.hasClass('fa-folder')).toBe(false);

            ontologyManagerSvc.hasClassIndividuals.and.returnValue(false);
            scope.$digest();
            expect(icon.hasClass('fa-folder')).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('returns the correct tree display', function() {
            it('for pretty print', function() {
                settingsManagerSvc.getTreeDisplay.and.returnValue('pretty');
                element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
                scope.$digest();
                controller = element.controller('individualTree');
                var result = controller.getTreeDisplay({});
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({});
                expect(result).toBe(ontologyManagerSvc.getEntityName({}));
            });
            it('for full IRI', function() {
                var entity = {matonto: {originalIRI: 'test'}};
                settingsManagerSvc.getTreeDisplay.and.returnValue('fullIRI');
                element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
                scope.$digest();
                controller = element.controller('individualTree');
                var result = controller.getTreeDisplay(entity);
                expect(result).toBe('test');

                entity = {matonto: {anonymous: 'test'}};
                result = controller.getTreeDisplay(entity);
                expect(result).toBe('test');

                entity = {};
                result = controller.getTreeDisplay(entity);
                expect(result).toBe('');
            });
        });
    });
    it('should set whether individuals are opened when a class is clicked', function() {
        element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
        scope.$digest();

        var classIcon = angular.element(element.querySelectorAll('ul.class > li a')[0]);
        classIcon.triggerHandler('click');
        expect(stateManagerSvc.setIndividualsOpened).toHaveBeenCalled();
    });
});