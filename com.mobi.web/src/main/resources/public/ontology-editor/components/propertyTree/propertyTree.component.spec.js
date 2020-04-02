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
    mockPrefixes,
    mockOntologyManager,
    mockOntologyState,
    mockUtil,
    injectUniqueKeyFilter,
    injectIndentConstant
} from '../../../../../../test/js/Shared';
import { join } from 'lodash';

describe('Property Tree component', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'treeItem');
        mockPrefixes();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
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

        scope.datatypeProps = [{
            entityIRI: 'dataProp1',
            hasChildren: true,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: ['a']
        }, {
            entityIRI: 'dataProp2',
            hasChildren: false,
            indent: 2,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: ['a', 'b']
        }];
        scope.objectProps = [{
            entityIRI: 'objectProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: ['a']
        }];
        scope.annotationProps = [{
            entityIRI: 'annotationProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened,
            path: ['a']
        }];
        scope.index = 4;
        scope.updateSearch = jasmine.createSpy('updateSearch');
        ontologyStateSvc.getActiveKey.and.returnValue('properties');
        this.element = $compile(angular.element('<property-tree datatype-props="datatypeProps" object-props="objectProps" annotation-props="annotationProps" index="index" update-search="updateSearch(value)"></property-tree>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyTree');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('datatypeProps should be one way bound', function() {
            var copy = angular.copy(scope.datatypeProps);
            this.controller.datatypeProps = [];
            scope.$digest();
            expect(angular.copy(scope.datatypeProps)).toEqual(copy);

        });
        it('objectProps should be one way bound', function() {
            var copy = angular.copy(scope.objectProps);
            this.controller.objectProps = [];
            scope.$digest();
            expect(angular.copy(scope.objectProps)).toEqual(copy);
        });
        it('annotationProps should be one way bound', function() {
            var copy = angular.copy(scope.annotationProps);
            this.controller.annotationProps = [];
            scope.$digest();
            expect(angular.copy(scope.annotationProps)).toEqual(copy);
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
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROPERTY-TREE');
        });
        it('with a .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toEqual(1);
        });
        it('with a .tree-item-wrapper', function() {
            expect(this.element.querySelectorAll('.tree-item-wrapper').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('$onInit initializes flatPropertyTree correctly', function() {
            this.controller.datatypeProps = [{prop: 'data'}];
            this.controller.objectProps = [{prop: 'object'}];
            this.controller.annotationProps = [{prop: 'annotation'}];
            this.controller.$onInit();
            var copy = angular.copy(this.controller.flatPropertyTree);
            expect(copy).toContain({title: 'Data Properties', get: ontologyStateSvc.getDataPropertiesOpened, set: ontologyStateSvc.setDataPropertiesOpened, isOpened: undefined});
            expect(copy).toContain({title: 'Object Properties', get: ontologyStateSvc.getObjectPropertiesOpened, set: ontologyStateSvc.setObjectPropertiesOpened, isOpened: undefined});
            expect(copy).toContain({title: 'Annotation Properties', get: ontologyStateSvc.getAnnotationPropertiesOpened, set: ontologyStateSvc.setAnnotationPropertiesOpened, isOpened: undefined});
            expect(copy).toContain({prop: 'data', get: ontologyStateSvc.getDataPropertiesOpened});
            expect(copy).toContain({prop: 'object', get: ontologyStateSvc.getObjectPropertiesOpened});
            expect(copy).toContain({prop: 'annotation', get: ontologyStateSvc.getAnnotationPropertiesOpened});
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
                this.filterEntity = {
                    entityIRI: 'urn:id',
                    names: ['Title']
                };
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    joinedPath: 'recordId.otherIri.iri',
                    names: ['Title']
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri'],
                    joinedPath: 'recordId.otherIri'
                };
                this.filterNodeFolder = {
                    title: 'Data Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.controller.flatPropertyTree = [this.filterNodeParent, this.filterNode, this.filterNodeFolder];
                this.controller.filterText = 'ti';
                ontologyStateSvc.joinPath.and.callFake((path) => {
                    if (path === this.filterNode.path) {
                        return 'recordId.otherIri.iri';
                    } else if (path === this.filterNodeParent.path) {
                        return 'recordId.otherIri';
                    }
                });
                
                ontologyManagerSvc.entityNameProps = [prefixes.dcterms + 'title'];
                ontologyStateSvc.joinPath.and.callFake((path) => {
                    return join(path, '.');
                });
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
            beforeEach(function() {
                this.get = jasmine.createSpy('get').and.returnValue(true);
                this.node = {
                    indent: 1,
                    path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                    joinedPath: 'recordId.otherIRI.andAnotherIRI.iri',
                    get: this.get
                };
                ontologyStateSvc.areParentsOpen.and.returnValue(false);
            });
            describe('node does not have an entityIRI property', function() {
                beforeEach(function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
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
            describe('node does have an entityIRI property and areParentsOpen is true and node.get is true', function() {
                beforeEach(function() {
                    this.node.entityIRI = 'iri';
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
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
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toEqual(true);
                    expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node, this.controller.activeTab);
                });
            });
            describe('false when node does have an entityIRI and', function() {
                beforeEach(function() {
                    this.node.entityIRI = 'iri';
                });
                describe('areParentsOpen is false', function() {
                    beforeEach(function() {
                        ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    });
                    describe('and filterText is set and node is parent node without a text match', function() {
                        beforeEach(function() {
                            this.controller.filterText = 'text';
                            this.node.parentNoMatch = true;
                            expect(this.controller.isShown(this.node)).toEqual(false);
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
                describe('node.get is false', function() {
                    beforeEach(function() {
                        ontologyStateSvc.areParentsOpen.and.returnValue(true);
                        this.get.and.returnValue(false);
                    });
                    describe('and filterText is set and node is parent node without a text match', function() {
                        beforeEach(function() {
                            this.controller.filterText = 'text';
                            this.node.parentNoMatch = true;
                            expect(this.controller.isShown(this.node)).toEqual(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                        it('and has a child that has a text match', function() {
                            this.node.displayNode = true;
                            expect(this.controller.isShown(this.node)).toEqual(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                        it('and does not have a child with a text match', function() {
                            expect(this.controller.isShown(this.node)).toEqual(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                    });
                    it('and filterText is not set and is not a parent node without a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                });
            });
        });
        describe('openEntities filter', function() {
            beforeEach(function() {
                this.node = {
                    set: jasmine.createSpy('set')
                };
            });
            describe('node has a title', function() {
                beforeEach(function() {
                    this.node.title = 'Data';
                });
                it('and it is open', function() {
                    ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = true;
                    expect(this.controller.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toEqual(true);
                    expect(this.node.displayNode).toEqual(true);
                    expect(this.node.set).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, true);
                });
                it('and it is not open', function() {
                    ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = false;
                    expect(this.controller.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toBeUndefined();
                    expect(this.node.displayNode).toBeUndefined();
                    expect(this.node.set).not.toHaveBeenCalled();
                });
            });
            describe('node does not have a title', function() {
                it('and it is open', function() {
                    ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = true;
                    expect(this.controller.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toEqual(true);
                    expect(this.node.displayNode).toEqual(true);
                    expect(this.node.set).not.toHaveBeenCalled();
                });
                it('and it is not open', function() {
                    ontologyStateSvc.listItem.editorTabStates[this.controller.activeTab].open[this.node.title] = false;
                    expect(this.controller.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toBeUndefined();
                    expect(this.node.displayNode).toBeUndefined();
                    expect(this.node.set).not.toHaveBeenCalled();
                });
            });
        });
    });
});