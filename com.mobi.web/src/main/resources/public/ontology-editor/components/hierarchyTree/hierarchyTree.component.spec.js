/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

describe('Hierarchy Tree component', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc, ontologyUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('treeItem', 'treeItem');
        mockPrefixes();
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
        });

        scope.hierarchy = [{
            entityIRI: 'class1',
            indent: 0,
            path: []
        }, {
            entityIRI: 'class2',
            indent: 1,
            path: []
        }, {
            entityIRI: 'class3',
            indent: 0,
            path: []
        }];
        scope.updateSearch = jasmine.createSpy('updateSearch');
        this.element = $compile(angular.element('<hierarchy-tree hierarchy="hierarchy" update-search="updateSearch(value)"></hierarchy-tree>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('hierarchyTree');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyUtils = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('hierarchy should be one way bound', function() {
            this.controller.hierarchy = [];
            scope.$digest();
            expect(angular.copy(scope.hierarchy)).toEqual([{
                entityIRI: 'class1',
                indent: 0,
                path: []
            }, {
                entityIRI: 'class2',
                indent: 1,
                path: []
            }, {
                entityIRI: 'class3',
                indent: 0,
                path: []
            }]);
        });
        it('updateSearch is one way bound', function() {
            this.controller.updateSearch({value: 'value'});
            expect(scope.updateSearch).toHaveBeenCalledWith('value');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isShown').and.returnValue(true);
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('HIERARCHY-TREE');
        });
        it('based on .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('based on tree-items', function() {
            expect(this.element.find('tree-item').length).toBe(1);
        });
        it('based on .tree-item-wrapper', function() {
            expect(this.element.querySelectorAll('.tree-item-wrapper').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('searchFilter', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri']
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri']
                };
                this.controller.hierarchy = [this.filterNodeParent, this.filterNode];
                this.controller.filterText = 'ti';
                this.filterEntity = {
                    '@id': 'urn:id',
                    [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                };
                ontologyStateSvc.getEntityByRecordId.and.returnValue(this.filterEntity);
                ontologyManagerSvc.entityNameProps = [prefixes.dcterms + 'title'];
            });
            describe('has filter text', function() {
                describe('and the entity has matching search properties', function() {
                    it('that have at least one matching text value', function() {
                        expect(this.controller.searchFilter(this.filterNode)).toBe(true);
                        expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.filterNode.path[0] + '.' + this.filterNode.path[1], true);
                    });
                    describe('that do not have a matching text value', function() {
                        beforeEach(function() {
                            var noMatchEntity = {
                                '@id': 'urn:id',
                            };
                            ontologyStateSvc.getEntityByRecordId.and.returnValue(noMatchEntity);
                        });
                        it('and the entity has no children', function() {
                            expect(this.controller.searchFilter(this.filterNode)).toBe(false);
                        });
                        it('and the entity has children', function() {
                            this.filterNode.hasChildren = true;
                            expect(this.controller.searchFilter(this.filterNode)).toBe(true);
                        });
                    });
                });
                it('and the entity does not have matching search properties', function() {
                    ontologyManagerSvc.entityNameProps = [];
                    expect(this.controller.searchFilter(this.filterNode)).toBe(false);
                });
            });
            it('does not have filter text', function() {
                this.controller.filterText = '';
                expect(this.controller.searchFilter(this.filterNode)).toBe(true);
            });
        });
        describe('isShown filter', function () {
            describe('indent is greater than 0 and areParentsOpen is true', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toBe(true);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toBe(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                });
            });
            describe('indent is 0 and the parent path has a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                        expect(this.controller.isShown(this.node)).toBe(true);
                    });
                    it('and does not have a child with a text match', function() {
                        ontologyStateSvc.areParentsOpen.and.returnValue(false);
                        expect(this.controller.isShown(this.node)).toBe(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toBe(true);
                });
            });
            describe('indent is greater than 0 and areParentsOpen is false', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toBe(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(this.controller.isShown(this.node)).toBe(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                });
            });
            describe('indent is 0 and the parent path does not have a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                        expect(this.controller.isShown(this.node)).toBe(false);
                    });
                    it('and does not have a child with a text match', function() {
                        ontologyStateSvc.areParentsOpen.and.returnValue(false);
                        expect(this.controller.isShown(this.node)).toBe(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toBe(false);
                });
            });
        });
    });
});
