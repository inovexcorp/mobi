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

describe('Annotation Tree directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc,
        stateManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('annotationTree');
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            ontologyManagerSvc.list = [{
                id: '',
                ontology: [{}],
                ontologyIRI: ''
            }];
            ontologyManagerSvc.getAnnotations.and.returnValue([{matonto:{originalIRI:'annotation1'}}, {matonto:{originalIRI:'annotation2'}}]);
            element = $compile(angular.element('<annotation-tree></annotation-tree>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tree class', function() {
            expect(element.hasClass('tree')).toBe(true);
        });
        it('based on container class', function() {
            var container = element.querySelectorAll('.container');
            expect(container.length).toBe(1);
        });
        it('based on ul', function() {
            var uls = element.find('ul');
            expect(uls.length).toBe(2);
        });
        it('based on container tree-items', function() {
            expect(ontologyManagerSvc.getAnnotations).toHaveBeenCalledWith(ontologyManagerSvc.list[0].ontology);
            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(ontologyManagerSvc.getAnnotations().length);
        });
    });
});
