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
            get: ontologyStateSvc.getNoDomainsOpened
        }, {
            entityIRI: 'dataProp2',
            hasChildren: false,
            indent: 2,
            get: ontologyStateSvc.getNoDomainsOpened
        }];
        scope.objectProps = [{
            entityIRI: 'objectProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened
        }];
        scope.annotationProps = [{
            entityIRI: 'annotationProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened
        }];
        scope.index = 4;
        scope.updateSearch = jasmine.createSpy('updateSearch');
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
            expect(copy).toContain({get: ontologyStateSvc.getDataPropertiesOpened, prop: 'data', entity: undefined, isOpened: false});
            expect(copy).toContain({get: ontologyStateSvc.getObjectPropertiesOpened, prop: 'object', entity: undefined, isOpened: false});
            expect(copy).toContain({get: ontologyStateSvc.getAnnotationPropertiesOpened, prop: 'annotation', entity: undefined, isOpened: false});
        });
        it('toggleOpen should set the correct values', function() {
            spyOn(this.controller, 'isShown').and.returnValue(false);
            var node = {isOpened: false, path: ['a', 'b']};
            this.controller.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith('a.b', true);
            expect(this.controller.isShown).toHaveBeenCalled();
            expect(this.controller.filteredHierarchy).toEqual([]);
        });
        describe('processFilters', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri']
                };
                this.filterEntity = {
                    '@id': 'urn:id',
                    '@type': [prefixes.owl + 'DatatypeProperty'],
                    [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                };
                this.filterNodeFolder = {
                    title: 'Data Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                ontologyStateSvc.getEntityByRecordId.and.returnValue(this.filterEntity);
                spyOn(this.controller, 'openAllParents');
                spyOn(this.controller, 'openPropertyFolders');
            });
            it('should return true when both the search and dropdown filter match', function() {
                this.controller.filterText = 'ti';
                this.controller.numDropdownFilters = 1;
                spyOn(this.controller, 'matchesDropdownFilters').and.returnValue(true);
                spyOn(this.controller, 'matchesSearchFilter').and.returnValue(true);
                expect(this.controller.processFilters(this.filterNode)).toEqual(true);
            });
            it('should return false when the search filter matches and dropdown filter does not match', function() {
                this.controller.filterText = 'ti';
                this.controller.numDropdownFilters = 0;
                spyOn(this.controller, 'matchesDropdownFilters').and.returnValue(false);
                spyOn(this.controller, 'matchesSearchFilter').and.returnValue(true);
                expect(this.controller.processFilters(this.filterNode)).toEqual(false);
            });
            it('should return false when the search filter matches and dropdown filter does not match', function() {
                this.controller.filterText = '';
                this.controller.numDropdownFilters = 1;
                spyOn(this.controller, 'matchesDropdownFilters').and.returnValue(true);
                spyOn(this.controller, 'matchesSearchFilter').and.returnValue(false);
                expect(this.controller.processFilters(this.filterNode)).toEqual(false);
            });
            it('should return true when both the search and dropdown filter do not match but the node has children', function() {
                this.filterNode.hasChildren = true;
                this.controller.filterText = '';
                this.controller.numDropdownFilters = 1;
                spyOn(this.controller, 'matchesDropdownFilters').and.returnValue(true);
                spyOn(this.controller, 'matchesSearchFilter').and.returnValue(false);
                expect(this.controller.processFilters(this.filterNode)).toEqual(true);
            });
            it('should return true when the node is a folder and has search or filter criteria', function() {
                this.controller.numDropdownFilters = 1;
                this.controller.filterText = '';
                expect(this.controller.processFilters(this.filterNodeFolder)).toEqual(true);
                expect(this.filterNodeFolder.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                expect(this.filterNodeFolder.parentNoMatch).toEqual(true);
            });
            it('should return true when the node is a folder and does not have search or filter criteria', function() {
                this.controller.numDropdownFilters = 0;
                this.controller.filterText = '';
                expect(this.controller.processFilters(this.filterNodeFolder)).toEqual(true);
                expect(this.filterNodeFolder.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
            });
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
        describe('openAllParents', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 2,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'anotherIri', 'iri']
                };
                this.filterNodeParent = {
                    indent: 1,
                    entityIRI: 'anotherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri', 'anotherIri']
                };
                this.filterNodeParentParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri']
                }
                this.controller.flatPropertyTree = [this.filterNodeParentParent, this.filterNodeParent, this.filterNode];
            });
            it('successfully opens all parents', function() {
                this.controller.openAllParents(this.filterNode);
                expect(ontologyStateSvc.setOpened).not.toHaveBeenCalledWith(this.filterNode.path[0], true);
                expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.filterNode.path[0] + '.' + this.filterNode.path[1], true);
                expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(this.filterNode.path[0] + '.' + this.filterNode.path[1] + '.' + this.filterNode.path[2], true);
                expect(ontologyStateSvc.setOpened).not.toHaveBeenCalledWith(this.filterNode.path[0] + '.' + this.filterNode.path[1] + '.' + this.filterNode.path[2] + '.' + this.filterNode.path[3], true);
                expect(this.filterNodeParentParent.isOpened).toEqual(true);
                expect(this.filterNodeParent.isOpened).toEqual(true);
            }); 
        });
        describe('matchesSearchFilter', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        [prefixes.dcterms + 'title']: [{'@value': 'Title'}],
                        '@id': 'urn:id',
                    }
                };
                this.noMatchNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:title',
                    }
                }
                this.controller.filterText = 'ti';
                ontologyStateSvc.getEntityByRecordId.and.returnValue(this.filterEntity);
                ontologyManagerSvc.entityNameProps = [prefixes.dcterms + 'title'];
            });
            describe('has filter text', function() {
                describe('and the entity has matching search properties', function() {
                    it('that have at least one matching text value', function() {
                        expect(this.controller.matchesSearchFilter(this.filterNode)).toEqual(true);
                    });
                    describe('that do not have a matching text value', function () {
                        beforeEach(function () {
                            utilSvc.getBeautifulIRI.and.returnValue('id');
                        });
                        it('and does not have a matching entity local name', function () {
                            expect(this.controller.matchesSearchFilter(this.noMatchNode)).toEqual(false);
                        });
                        it('and does have a matching entity local name', function() {
                            utilSvc.getBeautifulIRI.and.returnValue('title');
                            expect(this.controller.matchesSearchFilter(this.noMatchNode)).toEqual(true);
                        });
                    });
                });
                it('and the entity does not have matching search properties', function() {
                    ontologyManagerSvc.entityNameProps = [];
                    expect(this.controller.matchesSearchFilter(this.filterNode)).toEqual(false);
                });
            });
            it('does not have filter text', function() {
                this.controller.filterText = '';
                expect(this.controller.matchesSearchFilter(this.filterNode)).toEqual(true);
            });
        });
        describe('openPropertyFolders', function() {
            beforeEach(function() {
                this.filterNodeFolderDataProperties = {
                    title: 'Data Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.filterNodeFolderObjectProperties = {
                    title: 'Object Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.filterNodeFolderAnnotationProperties = {
                    title: 'Annotation Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.controller.flatPropertyTree = [this.filterNodeFolderDataProperties, this.filterNodeFolderObjectProperties, this.filterNodeFolderAnnotationProperties];

            });
            it('opens data property folder if a node has a datatype property', function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:id',
                        '@type': [prefixes.owl + 'DatatypeProperty'],
                        [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                    }
                };
                this.controller.flatPropertyTree.unshift(this.filterNode)
                this.controller.openPropertyFolders(this.filterNode);
                expect(this.filterNodeFolderDataProperties.displayNode).toEqual(true);
                expect(this.filterNodeFolderDataProperties.isOpened).toEqual(true);
                expect(this.filterNodeFolderObjectProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderObjectProperties.hasOwnProperty('isOpened')).toEqual(false);
                expect(this.filterNodeFolderAnnotationProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderAnnotationProperties.hasOwnProperty('isOpened')).toEqual(false);
            });
            it('opens object property folders', function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:id',
                        '@type': [prefixes.owl + 'ObjectProperty'],
                        [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                    }
                };
                this.controller.flatPropertyTree.unshift(this.filterNode)
                this.controller.openPropertyFolders(this.filterNode);
                expect(this.filterNodeFolderDataProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderDataProperties.hasOwnProperty('isOpened')).toEqual(false);
                expect(this.filterNodeFolderObjectProperties.displayNode).toEqual(true);
                expect(this.filterNodeFolderObjectProperties.isOpened).toEqual(true);
                expect(this.filterNodeFolderAnnotationProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderAnnotationProperties.hasOwnProperty('isOpened')).toEqual(false);
            });
            it('opens annotation property folders', function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:id',
                        '@type': [prefixes.owl + 'AnnotationProperty'],
                        [prefixes.dcterms + 'title']: [{'@value': 'Title'}]
                    }
                };
                this.controller.flatPropertyTree.unshift(this.filterNode)
                this.controller.openPropertyFolders(this.filterNode);
                expect(this.filterNodeFolderDataProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderDataProperties.hasOwnProperty('isOpened')).toEqual(false);
                expect(this.filterNodeFolderObjectProperties.hasOwnProperty('displayNode')).toEqual(false);
                expect(this.filterNodeFolderObjectProperties.hasOwnProperty('isOpened')).toEqual(false);
                expect(this.filterNodeFolderAnnotationProperties.displayNode).toEqual(true);
                expect(this.filterNodeFolderAnnotationProperties.isOpened).toEqual(true);           });
        });
        describe('isShown filter', function() {
            beforeEach(function() {
                this.get = jasmine.createSpy('get').and.returnValue(true);
                this.node = {
                    indent: 1,
                    path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                    get: this.get
                };
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
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toEqual(false);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toEqual(true);
                    expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
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
    });
});
