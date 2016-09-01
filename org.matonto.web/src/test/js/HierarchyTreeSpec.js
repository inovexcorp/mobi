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


describe('Hierarchy Tree directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        stateManagerSvc;

    beforeEach(function() {
        module('templates');
        module('hierarchyTree');
        mockStateManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
        });

        stateManagerSvc.getOpened.and.returnValue(true);
        scope.hierarchy = [{
            entityIRI: 'class1',
            subEntities: [{
                entityIRI: 'class2'
            }]
        },
        {
            entityIRI: 'class3'
        }];
        scope.editor = 'editor-string';
        element = $compile(angular.element('<hierarchy-tree hierarchy="hierarchy" editor="editor"></hierarchy-tree>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('hierarchy should be two way bound', function() {
            isolatedScope.hierarchy = [];
            scope.$digest();
            expect(scope.hierarchy).toEqual([]);
        });
        it('editor should be one way bound', function() {
            isolatedScope.editor = '';
            scope.$digest();
            expect(scope.editor).toEqual('editor-string');
        });
    });

    describe('replaces the element with the correct html', function() {
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
            expect(uls.length).toBe(3);
        });
        it('based on container tree-items', function() {
            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(1);
        });
    });
});
