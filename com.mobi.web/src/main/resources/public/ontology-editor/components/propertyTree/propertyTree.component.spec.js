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

describe('Property Tree component', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc, ontologyUtils, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('treeItem', 'treeItem');
        mockPrefixes();
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockUtil();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _ontologyUtilsManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtils = _ontologyUtilsManagerService_;
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
        ontologyUtils = null;
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
            expect(this.element.prop('tagName')).toBe('PROPERTY-TREE');
        });
        it('with a .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('with a .tree-item-wrapper', function() {
            expect(this.element.querySelectorAll('.tree-item-wrapper').length).toBe(1);
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
                this.filterNodeFolder = {
                    title: 'Data Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.controller.flatPropertyTree = [this.filterNodeParent, this.filterNode, this.filterNodeFolder];
                this.controller.filterText = 'ti';
                this.filterEntity = {
                    '@id': 'urn:id',
                    '@type': [prefixes.owl + 'DatatypeProperty'],
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
                    describe('that do not have a matching text value', function () {
                        beforeEach(function () {
                            var noMatchEntity = {
                                '@id': 'urn:title',
                                '@type': [prefixes.owl + 'DatatypeProperty']
                            };
                            ontologyStateSvc.getEntityByRecordId.and.returnValue(noMatchEntity);
                            utilSvc.getBeautifulIRI.and.returnValue('id');
                        });
                        describe('and does not have a matching entity local name', function () {
                            it('and the node has no children', function () {
                                expect(this.controller.searchFilter(this.filterNode)).toBe(false);
                            });
                            it('and the node has children', function () {
                                this.filterNode.hasChildren = true;
                                expect(this.controller.searchFilter(this.filterNode)).toBe(true);
                            });
                        });
                        it('and does have a matching entity local name', function() {
                            utilSvc.getBeautifulIRI.and.returnValue('title');
                            expect(this.controller.searchFilter(this.filterNode)).toBe(true);
                        });
                    });
                });
                it('and the entity does not have matching search properties', function() {
                    ontologyManagerSvc.entityNameProps = [];
                    expect(this.controller.searchFilter(this.filterNode)).toBe(false);
                });
                it('and the node is a folder', function() {
                    expect(this.controller.searchFilter(this.filterNodeFolder)).toBe(true);
                })
            });
            it('does not have filter text', function() {
                this.controller.filterText = '';
                expect(this.controller.searchFilter(this.filterNode)).toBe(true);
            });
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
                        expect(this.controller.isShown(this.node)).toBe(true);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toBe(true);
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
                        expect(this.controller.isShown(this.node)).toBe(true);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(this.node);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(this.node)).toBe(true);
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
                            expect(this.controller.isShown(this.node)).toBe(false);
                        });
                        it('and has a child that has a text match', function() {
                            this.node.displayNode = true;
                            expect(this.controller.isShown(this.node)).toBe(false);
                        });
                        it('and does not have a child with a text match', function() {
                            expect(this.controller.isShown(this.node)).toBe(false);
                        });
                    });
                    it('and filterText is not set and is not a parent node without a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
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
                            expect(this.controller.isShown(this.node)).toBe(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                        it('and has a child that has a text match', function() {
                            this.node.displayNode = true;
                            expect(this.controller.isShown(this.node)).toBe(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                        it('and does not have a child with a text match', function() {
                            expect(this.controller.isShown(this.node)).toBe(false);
                            expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        });
                    });
                    it('and filterText is not set and is not a parent node without a text match', function() {
                        expect(this.controller.isShown(this.node)).toBe(false);
                        expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    });
                });
            });
        });
    });
});
