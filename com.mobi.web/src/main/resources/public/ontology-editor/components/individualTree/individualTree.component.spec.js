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
import {
    mockComponent,
    mockOntologyManager,
    mockOntologyState,
    mockUtil,
    mockOntologyUtilsManager,
    mockPrefixes,
    injectUniqueKeyFilter,
    injectIndentConstant
} from '../../../../../../test/js/Shared';
import { join } from 'lodash';

describe('Individual Tree component', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'treeItem');
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        mockPrefixes();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.hierarchy = [{
            entityIRI: 'Class A',
            hasChildren: false,
            path: ['recordId', 'Class A'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A1'],
            indent: 1
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A2'],
            indent: 1
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: ['recordId', 'Class B'],
            indent: 0,
            isClass: true
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1'],
            indent: 1,
            isClass: true
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1', 'Individual B1'],
            indent: 2
        }];
        scope.index = 4;
        ontologyStateSvc.getActiveKey.and.returnValue('individuals');
        scope.updateSearch = jasmine.createSpy('updateSearch');
        this.element = $compile(angular.element('<individual-tree hierarchy="hierarchy" index="index" update-search="updateSearch(value)"></individual-tree>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('individualTree');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('hierarchy should be one way bound', function() {
            var copy = angular.copy(scope.hierarchy);
            this.controller.hierarchy = [];
            scope.$digest();
            expect(angular.copy(scope.hierarchy)).toEqual(copy);
        });
        it('index should be one way bound', function() {
            this.controller.index = 0;
            scope.$digest();
            expect(scope.index).toEqual(4);
        });
        it('updateSearch is one way bound', function() {
            this.controller.updateSearch({value: 'value'});
            expect(scope.updateSearch).toHaveBeenCalledWith('value');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isShown').and.returnValue(true);
            scope.$apply();
        });
        it('with wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('INDIVIDUAL-TREE');
            expect(this.element.querySelectorAll('.tree').length).toEqual(1);
            expect(this.element.querySelectorAll('.individual-tree').length).toEqual(1);
        });
        it('with a .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toEqual(1);
        });
        it('with a tree-item', function() {
            expect(this.element.find('tree-item').length).toEqual(1);
        });
        it('with a .tree-item-wrapper', function() {
            expect(this.element.querySelectorAll('.tree-item-wrapper').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('clickItem should call the correct method', function() {
            this.controller.clickItem('iri');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri', undefined, ontologyStateSvc.listItem.editorTabStates.individuals.targetedSpinnerId);
        });
        it('toggleOpen should set the correct values', function() {
            spyOn(this.controller, 'isShown').and.returnValue(false);
            var node = {isOpened: false, path: ['a', 'b'], joinedPath: 'a.b'};
            this.controller.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[node.joinedPath]).toEqual(true);
            expect(this.controller.isShown).toHaveBeenCalled();
            expect(this.controller.filteredHierarchy).toEqual([]);
        });
        describe('matchesDropdownFilters', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri']
                };
            });
            it('returns true when all flagged dropdown filters return true', function() {
                this.controller.dropdownFilters.forEach(filter => {
                    filter.flag = true;
                    spyOn(filter, 'filter').and.returnValue(true);
                });
                expect(this.controller.matchesDropdownFilters(this.filterNode)).toEqual(true);
            });
            it('returns true when all flagged dropdown filters do not return true', function() {
                this.controller.dropdownFilters.forEach(filter => {
                    filter.flag = true;
                    spyOn(filter, 'filter').and.returnValue(false);
                });
                expect(this.controller.matchesDropdownFilters(this.filterNode)).toEqual(false);
            });
            it('returns true when there are no flagged dropdowns', function() {
                this.controller.dropdownFilters.forEach(filter => {
                    filter.flag = false;
                    spyOn(filter, 'filter').and.returnValue(false);
                });
                expect(this.controller.matchesDropdownFilters(this.filterNode)).toEqual(true);
            });
        });
        describe('searchFilter', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    names: ['Title']
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri']
                };
                this.filterNodeClass = {
                    entityIRI: 'Class A',
                    hasChildren: false,
                    path: ['recordId', 'Class A'],
                    indent: 0,
                    isClass: true
                };
                this.controller.hierarchy = [this.filterNodeParent, this.filterNode, this.filterNodeClass];
                this.controller.filterText = 'ti';
                ontologyStateSvc.joinPath.and.callFake((path) => {
                    if (path === this.filterNode.path) {
                        return 'recordId.otherIri.iri';
                    } else if (path === this.filterNodeParent.path) {
                        return 'recordId.otherIri';
                    } else if (path === this.filterNodeClass.path) {
                        return 'recordId.Class A';
                    }
                });
                ontologyManagerSvc.entityNameProps = [prefixes.dcterms + 'title'];
                ontologyStateSvc.joinPath.and.callFake((path) => join(path, '.'));
            });
            describe('has filter text', function() {
                describe('and the entity names', function() {
                    it('have at least one matching text value', function() {
                        expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
                        expect(ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                    });
                    describe('do not have a matching text value', function () {
                        beforeEach(function () {
                            this.filterNode.names = [];
                        });
                        it('and does not have a matching entity local name', function () {
                            utilSvc.getBeautifulIRI.and.returnValue('id');
                            expect(this.controller.searchFilter(this.filterNode)).toEqual(false);
                        });
                        it('and does have a matching entity local name', function() {
                            utilSvc.getBeautifulIRI.and.returnValue('title');
                            expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
                        });
                    });
                });
            });
            it('does not have filter text', function() {
                this.controller.filterText = '';
                expect(this.controller.searchFilter(this.filterNode)).toEqual(true);
            });
        });
        describe('isShown filter', function() {
            describe('indent is greater than 0 and areParentsOpen is true', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.andAnotherIRI.iri'
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toEqual(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                });
            });
            describe('indent is 0 and the parent path has a length of 2', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'iri'],
                        joinedPath: 'recordId.iri'
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(true);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toEqual(true);
                });
            });
            describe('indent is greater than 0 and areParentsOpen is false', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.iri'
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(this.controller.isShown(this.node)).toEqual(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                });
            });
            describe('indent is 0 and the parent path does not have a length of 2', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.iri'
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        this.controller.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(this.controller.isShown(this.node)).toEqual(false);
                });
            });
        });
        describe('openEntities filter', function() {
            beforeEach(function() {
                this.node = {};
            });
            it('node is open', function() {
                ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = true;
                expect(this.controller.openEntities(this.node)).toEqual(true);
                expect(this.node.isOpened).toEqual(true);
                expect(this.node.displayNode).toEqual(true);
            });
            it('node is not open', function() {
                ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = false;
                expect(this.controller.openEntities(this.node)).toEqual(true);
                expect(this.node.isOpened).toBeUndefined();
                expect(this.node.displayNode).toBeUndefined();
            });
        });
    });
});
