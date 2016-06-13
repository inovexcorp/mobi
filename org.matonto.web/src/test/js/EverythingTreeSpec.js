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
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('everythingTree');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.vm = {
            ontologies: [
                {
                    matonto: {
                        classes: [
                            {
                                matonto: {
                                    properties: ['property1']
                                }
                            }
                        ],
                        noDomains: ['property1']
                    }
                }
            ]
        }

    });

    injectDirectiveTemplate('modules/ontology-editor/directives/everythingTree/everythingTree.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
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
            expect(container.length).toBe(3);
        });
        it('based on <ul>s', function() {
            var uls = element.querySelectorAll('ul');
            expect(uls.length).toBe(5);
        });
        it('based on container tree-items', function() {
            var treeItems = element.querySelectorAll('.container tree-item');
            expect(treeItems.length).toBe(3);
        });
        describe('based on tree-item length', function() {
            it('when ontology.noDomains is empty', function() {
                scope.vm.ontologies[0].matonto.noDomains = [];
                scope.$digest();

                var treeItems = element.querySelectorAll('.container tree-item');
                expect(treeItems.length).toBe(2);
            });
            it('when class.matonto.properties is empty', function() {
                scope.vm.ontologies[0].matonto.classes[0].matonto.properties = [];
                scope.$digest();

                var treeItems = element.querySelectorAll('.container tree-item');
                expect(treeItems.length).toBe(2);
            });
            it('when ontology.matonto.classes is empty', function() {
                scope.vm.ontologies[0].matonto.classes = [];
                scope.$digest();

                var treeItems = element.querySelectorAll('.container tree-item');
                expect(treeItems.length).toBe(1);
            });
        });
    });
});