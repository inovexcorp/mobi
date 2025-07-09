/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { cloneDeep, join } from 'lodash';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { HierarchyFilterComponent } from '../hierarchyFilter/hierarchyFilter.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { DCTERMS } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { PropertyTreeComponent } from './propertyTree.component';

describe('Property Tree component', function() {
    let component: PropertyTreeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropertyTreeComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;

    const propsList = [{
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

    const iriList = {'iri': 'ontRecord', 'iri2': 'ontRecord'};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule, ScrollingModule ],
            declarations: [
                PropertyTreeComponent,
                MockComponent(HierarchyFilterComponent),
                MockComponent(TreeItemComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyTreeComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerServiceStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

        ontologyStateServiceStub.listItem = new OntologyListItem();

        ontologyStateServiceStub.joinPath.and.callFake((path) => {
            if (path === undefined) {
                return '';
            }
            if (path[0] === 'recordId') {
                if (path[1] === 'class1') {
                    return 'recordId.class1';
                }
                return 'recordId';
            }
        });
        ontologyStateServiceStub.getActiveKey.and.returnValue('properties');
        component.datatypeProps = [{
            entityIRI: 'dataProp1',
            hasChildren: true,
            indent: 1,
            get: ontologyStateServiceStub.getNoDomainsOpened,
            path: ['a']
        }, {
            entityIRI: 'dataProp2',
            hasChildren: false,
            indent: 2,
            get: ontologyStateServiceStub.getNoDomainsOpened,
            path: ['a', 'b']
        }];
        component.objectProps = [{
            entityIRI: 'objectProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateServiceStub.getNoDomainsOpened,
            path: ['a']
        }];
        component.annotationProps = [{
            entityIRI: 'annotationProp1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateServiceStub.getNoDomainsOpened,
            path: ['a']
        }];
        component.index = 0;
        component.filterText = '';
        component.searchText = '';
        component.ngOnInit();
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
    });

    describe('contains the correct html', function() {
        beforeEach(async function() {
            component.datatypeProps = propsList;
            fixture.detectChanges();
            await fixture.whenStable();
        });
        it('with a .repeater-container', function() {
            expect(element.queryAll(By.css('.repeater-container')).length).toEqual(1);
        });
        it('with a .tree-item-wrapper', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.tree-item-wrapper')).length).toEqual(3);
        });
    });
    describe('controller methods', function() {
        it('ngOnInit initializes flatPropertyTree correctly', function() {
            component.datatypeProps = [{prop: 'data'}];
            component.objectProps = [{prop: 'object'}];
            component.annotationProps = [{prop: 'annotation'}];
            ontologyStateServiceStub.joinPath.and.callFake((path) => {
                    if (path === this.filterNode.path) {
                        return 'recordId.otherIri.iri';
                    } else if (path === this.filterNodeParent.path) {
                        return 'recordId.otherIri';
                    }
                });

            component.ngOnInit();
            const copy = cloneDeep(component.flatPropertyTree);
            expect(copy).toContain(jasmine.objectContaining({title: 'Data Properties', get: jasmine.any(Function), set: jasmine.any(Function)}));
            expect(copy).toContain(jasmine.objectContaining({title: 'Object Properties', get: jasmine.any(Function), set: jasmine.any(Function)}));
            expect(copy).toContain(jasmine.objectContaining({title: 'Annotation Properties', get: jasmine.any(Function), set: jasmine.any(Function)}));
            expect(copy).toContain(jasmine.objectContaining({prop: 'data', get: jasmine.any(Function)}));
            expect(copy).toContain(jasmine.objectContaining({prop: 'object', get: jasmine.any(Function)}));
            expect(copy).toContain(jasmine.objectContaining({prop: 'annotation', get: jasmine.any(Function)}));
        });
        it('clickItem should call the correct method', function() {
            ontologyStateServiceStub.selectItem.and.returnValue(of(null));
            component.clickItem('iri');
            expect(ontologyStateServiceStub.selectItem).toHaveBeenCalledWith('iri');
        });
        it('toggleOpen should set the correct values', function() {
            component.preFilteredHierarchy = [{
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
            spyOn(component, 'isShown').and.returnValue(false);
            const node: HierarchyNode = {
                isOpened: false, path: ['a', 'b'], joinedPath: 'a.b',
                entityIRI: '',
                hasChildren: false,
                indent: 0,
                entityInfo: undefined
            };
            component.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[node.joinedPath]).toEqual(true);
            expect(component.isShown).toHaveBeenCalledWith(jasmine.any(Object));
            expect(component.filteredHierarchy).toEqual([]);
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
                component.dropdownFilters.forEach(filter => {
                    filter.flag = true;
                    spyOn(filter, 'filter').and.returnValue(true);
                });
                expect(component.matchesDropdownFilters(this.filterNode)).toEqual(true);
            });
            it('returns true when all flagged dropdown filters do not return true', function() {
                component.dropdownFilters.forEach(filter => {
                    filter.flag = true;
                    spyOn(filter, 'filter').and.returnValue(false);
                });
                expect(component.matchesDropdownFilters(this.filterNode)).toEqual(false);
            });
            it('returns true when there are no flagged dropdowns', function() {
                component.dropdownFilters.forEach(filter => {
                    filter.flag = false;
                    spyOn(filter, 'filter').and.returnValue(false);
                });
                expect(component.matchesDropdownFilters(this.filterNode)).toEqual(true);
            });
        });
        describe('searchFilter', function() {
            beforeEach(function() {
                this.filterEntity = {
                    entityIRI: 'urn:id',
                    entityInfo: {
                        names: ['Title']
                    }
                };
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    joinedPath: 'recordId.otherIri.iri',
                    entityInfo: {
                        names: ['Title']
                    }
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri'],
                    joinedPath: 'recordId.otherIri'
                };
                this.dataFolder = {
                    title: 'Data Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.objectFolder = {
                    title: 'Object Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                this.annotationFolder = {
                    title: 'Annotation Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                component.flatPropertyTree = [this.filterNodeParent, this.filterNode, this.dataFolder, this.objectFolder, this.annotationFolder];
                component.filterText = 'ti';
                ontologyStateServiceStub.joinPath.and.callFake((path) => {
                    if (path === this.filterNode.path) {
                        return 'recordId.otherIri.iri';
                    } else if (path === this.filterNodeParent.path) {
                        return 'recordId.otherIri';
                    }
                });
                ontologyStateServiceStub.joinPath.and.callFake((path) => {
                    return join(path, '.');
                });
                ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Data Properties'] = false;
                ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Object Properties'] = false;
                ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Annotation Properties'] = false;
            });
            describe('has filter text', function() {
                describe('and the entity names', function() {
                    describe('have at least one matching text value', function() {
                        it('and it is a data property', function() {
                            ontologyStateServiceStub.listItem.dataProperties.iris = iriList;
                            expect(component.searchFilter(this.filterNode)).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Data Properties']).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Object Properties']).toEqual(false);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Annotation Properties']).toEqual(false);
                        });
                        it('and it is an object property', function() {
                            ontologyStateServiceStub.listItem.objectProperties.iris = iriList;
                            expect(component.searchFilter(this.filterNode)).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Data Properties']).toEqual(false);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Object Properties']).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Annotation Properties']).toEqual(false);
                        });
                        it('and it is an annotation', function() {
                            ontologyStateServiceStub.listItem.annotations.iris = iriList;
                            expect(component.searchFilter(this.filterNode)).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Data Properties']).toEqual(false);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Object Properties']).toEqual(false);
                            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open['Annotation Properties']).toEqual(true);
                        });
                    });
                    describe('do not have a matching text value', function () {
                        beforeEach(function () {
                            this.filterNode.entityInfo.names = [];
                        });
                        it('and does not have a matching entity local name', function () {
                            expect(component.searchFilter(this.filterNode)).toEqual(false);
                        });
                        it('and does have a matching entity local name', function() {
                            this.filterNode.entityIRI = 'tiber';
                            expect(component.searchFilter(this.filterNode)).toEqual(true);
                        });
                    });
                });
            });
            it('does not have filter text', function() {
                component.filterText = '';
                expect(component.searchFilter(this.filterNode)).toEqual(true);
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
                ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
            });
            describe('node does not have an entityIRI property', function() {
                beforeEach(function() {
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(this.node)).toEqual(true);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                    expect(component.isShown(this.node)).toEqual(true);
                });
            });
            describe('node does have an entityIRI property and areParentsOpen is true and node.get is true', function() {
                beforeEach(function() {
                    this.node.entityIRI = 'iri';
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(this.node)).toEqual(true);
                        expect(this.get).toHaveBeenCalledWith(3);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(this.get).toHaveBeenCalledWith(3);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                    expect(component.isShown(this.node)).toEqual(true);
                    expect(this.get).toHaveBeenCalledWith(3);
                    expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                });
            });
            describe('false when node does have an entityIRI and', function() {
                beforeEach(function() {
                    this.node.entityIRI = 'iri';
                });
                describe('areParentsOpen is false', function() {
                    beforeEach(function() {
                        ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
                    });
                    describe('and filterText is set and node is parent node without a text match', function() {
                        beforeEach(function() {
                            component.filterText = 'text';
                            this.node.parentNoMatch = true;
                        });
                        it('and has a child that has a text match', function() {
                            this.node.displayNode = true;
                            expect(component.isShown(this.node)).toEqual(false);
                        });
                        it('and does not have a child with a text match', function() {
                            expect(component.isShown(this.node)).toEqual(false);
                        });
                    });
                    it('and filterText is not set and is not a parent node without a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                    });
                });
                describe('node.get is false', function() {
                    beforeEach(function() {
                        ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                        this.get.and.returnValue(false);
                    });
                    describe('and filterText is set and node is parent node without a text match', function() {
                        beforeEach(function() {
                            component.filterText = 'text';
                            this.node.parentNoMatch = true;
                        });
                        it('and has a child that has a text match', function() {
                            this.node.displayNode = true;
                            expect(component.isShown(this.node)).toEqual(false);
                            expect(this.get).toHaveBeenCalledWith(3);
                        });
                        it('and does not have a child with a text match', function() {
                            expect(component.isShown(this.node)).toEqual(false);
                            expect(this.get).toHaveBeenCalledWith(3);
                        });
                    });
                    it('and filterText is not set and is not a parent node without a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(this.get).toHaveBeenCalledWith(3);
                    });
                });
            });
        });
        describe('openEntities filter', function() {
            describe('node has a title', function() {
                beforeEach(function() {
                    this.node = {
                        title: 'test',
                        set: jasmine.createSpy('set')
                    };
                });
                it('and it is open', function() {
                    ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = true;
                    expect(component.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toEqual(true);
                    expect(this.node.displayNode).toEqual(true);
                });
                it('and it is not open', function() {
                    ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = false;
                    expect(component.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toBeUndefined();
                    expect(this.node.displayNode).toBeUndefined();
                });
            });
            describe('node does not have a title', function() {
                beforeEach(function() {
                    this.node = {};
                });
                it('and it is open', function() {
                    ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = true;
                    expect(component.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toEqual(true);
                    expect(this.node.displayNode).toEqual(true);
                });
                it('and it is not open', function() {
                    ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = false;
                    expect(component.openEntities(this.node)).toEqual(true);
                    expect(this.node.isOpened).toBeUndefined();
                    expect(this.node.displayNode).toBeUndefined();
                });
            });
        });
    });
});
