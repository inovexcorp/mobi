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
    var $compile, scope, element, ontologyStateSvc, ontologyManagerSvc, util;

    beforeEach(function() {
        module('templates');
        module('individualTree');
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        injectUniqueIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_;
        });

        ontologyStateSvc.listItem = {
            classesWithIndividuals: [{
                entityIRI: 'class1',
                subEntities: [{
                    entityIRI: 'class2'
                }]
            }]
        }
        ontologyStateSvc.getOpened.and.returnValue(true);
        ontologyStateSvc.getIndividualsOpened.and.returnValue(true);
        ontologyManagerSvc.getClassIndividuals.and.returnValue(['individual1']);

        element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('tree')).toBe(true);
        });
        it('depending on the number of classes', function() {
            var classes = element.querySelectorAll('ul.class');
            var links = element.querySelectorAll('ul.class > li a');
            expect(classes.length).toBe(ontologyStateSvc.listItem.classesWithIndividuals.length);
            expect(links.length).toBe(ontologyStateSvc.listItem.classesWithIndividuals.length*2);
        });
        it('depending on the number of individuals', function() {
            var individuals = element.querySelectorAll('.individual');
            expect(individuals.length).toBe(ontologyManagerSvc.getClassIndividuals().length*2);
        });
        it('depending on whether the individuals of a class are open', function() {
            ontologyStateSvc.getIndividualsOpened.and.returnValue(false);
            element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
            scope.$digest();
            var container = angular.element(element.querySelectorAll('ul.class > .container'));
            var icon = angular.element(element.querySelectorAll('ul.class > li a i')[0]);
            expect(container.length).toBe(0);
            expect(icon.hasClass('fa-folder-o')).toBe(true);

            ontologyStateSvc.getIndividualsOpened.and.returnValue(true);
            element = $compile(angular.element('<individual-tree></individual-tree>'))(scope);
            scope.$digest();
            container = angular.element(element.querySelectorAll('ul.class > .container'));
            icon = angular.element(element.querySelectorAll('ul.class > li a i')[0]);
            expect(container.length).toBe(1);
            expect(icon.hasClass('fa-folder-open-o')).toBe(true);
        });
    });
});
