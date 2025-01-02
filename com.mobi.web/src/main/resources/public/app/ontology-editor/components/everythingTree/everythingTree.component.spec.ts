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
import { join } from 'lodash';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ScrollingModule } from '@angular/cdk/scrolling';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { HierarchyFilterComponent } from '../hierarchyFilter/hierarchyFilter.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { DCTERMS } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { EverythingTreeComponent } from './everythingTree.component';

describe('Everything Tree component', function() {
    let component: EverythingTreeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EverythingTreeComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule, ScrollingModule ],
            declarations: [
                EverythingTreeComponent,
                MockComponent(HierarchyFilterComponent),
                MockComponent(TreeItemComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EverythingTreeComponent);
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
        component.hierarchy = [{
            entityIRI: 'class1',
            hasChildren: true,
            indent: 0,
            path: ['recordId'],
            joinedPath: 'recordId'
        }, {
            entityIRI: 'property1',
            hasChildren: false,
            indent: 1,
            path: ['recordId', 'class1'],
            joinedPath: 'recordId.class1'
        }, {
            title: 'Properties',
            get: jasmine.createSpy('get').and.returnValue(true),
            set: jasmine.createSpy('set')
        }, {
            entityIRI: 'property1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateServiceStub.getNoDomainsOpened,
            joinedPath: '',
        }];
        ontologyStateServiceStub.getActiveKey.and.returnValue('overview');
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
            fixture.detectChanges();
            await fixture.whenStable();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.tree')).length).toEqual(1);
            expect(element.queryAll(By.css('.everything-tree')).length).toEqual(1);
            expect(element.queryAll(By.css('.hierarchy-tree')).length).toEqual(1);
        });
        it('based on .repeater-container', function() {
            expect(element.queryAll(By.css('.repeater-container')).length).toEqual(1);
        });
        it('based on tree-items', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.tree-item')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('clickItem should call the correct method', function() {
            ontologyStateServiceStub.selectItem.and.returnValue(of(null));
            component.clickItem('iri');
            expect(ontologyStateServiceStub.selectItem).toHaveBeenCalledWith('iri');
        });
        it('toggleOpen should set the correct values', function() {
            component.preFilteredHierarchy = [{
                entityIRI: 'www.test.com',
                hasChildren: true,
                indent: 0,
                path: ['www.test.com'],
                entityInfo: {
                    names: ['test'],
                    label: 'test',
                    imported: false,
                    ontologyId: 'www.testontology.com'
                },
                joinedPath: 'www.test.com'
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
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri']
                };
                this.filterNode = {
                    indent: 1,
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entityIRI: 'iri',
                    entityInfo: {
                        names: ['Title']
                    }
                };
                this.filterNodeFolder = {
                    title: 'Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set')
                };
                component.hierarchy = [this.filterNodeParent, this.filterNode, this.filterNodeFolder];
                component.filterText = 'ti';
                ontologyManagerServiceStub.entityNameProps = [`${DCTERMS}title`];
                ontologyStateServiceStub.joinPath.and.callFake((path) => {
                    return join(path, '.');
                });
            });
            describe('has filter text', function() {
                describe('and the node has matching search properties', function() {
                    it('that have at least one matching text value', function () {
                        expect(component.searchFilter(this.filterNode)).toEqual(true);
                        expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                    });
                    describe('that do not have a matching text value', function () {
                        beforeEach(function () {
                            this.filterNode.entityInfo.names = [];
                        });
                        describe('and does not have a matching entity local name', function () {
                            it('and the node has no children', function () {
                                expect(component.searchFilter(this.filterNode)).toEqual(false);
                            });
                            it('and the node has children', function () {
                                this.filterNode.hasChildren = true;
                                expect(component.searchFilter(this.filterNode)).toEqual(true);
                            });
                        });
                        it('and does have a matching entity local name', function() {
                            this.filterNode.entityIRI = 'tiber';
                            expect(component.searchFilter(this.filterNode)).toEqual(true);
                        });
                    });
                });
                it('and the node is a folder', function() {
                    expect(component.searchFilter(this.filterNodeFolder)).toEqual(true);
                });
            });
            it('does not have filter text', function() {
                component.filterText = '';
                expect(component.searchFilter(this.filterNode)).toEqual(true);
            });
        });
        describe('the active entity filter', function() {
            beforeEach(function() {
                this.importedNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri']
                };
                this.activeEntityNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                };
            });
            it('matches when an entity is not imported', function() {
                ontologyStateServiceStub.isImported.and.returnValue(false);
                expect(component.activeEntityFilter.filter(this.activeEntityNode)).toEqual(true);
            });
            it('does not match when an entity imported', function() {
                ontologyStateServiceStub.isImported.and.returnValue(true);
                expect(component.activeEntityFilter.filter(this.importedNode)).toEqual(false);
            });
        });
        describe('isShown filter', function() {
            beforeEach(function() {
                ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
            });
            describe('when node does not have an entityIRI', function () {
                beforeEach(function() {
                    this.node = {};
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
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
                    expect(component.isShown(this.node)).toEqual(true);
                });
            });
            describe('when node does have an entityIRI and get returns true', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        get: jasmine.createSpy('get').and.returnValue(true)
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(this.node)).toEqual(true);
                        expect(this.node.get).toHaveBeenCalledWith();
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith();
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(component.isShown(this.node)).toEqual(true);
                    expect(this.node.get).toHaveBeenCalledWith();
                });
            });
            describe('when node does have an entityIRI, does not have a get, indent is greater than 0, and areParentsOpen is true', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.andAnotherIRI.iri'
                    };
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(this.node)).toEqual(true);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(component.isShown(this.node)).toEqual(true);
                    expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                });
            });
            describe('when node does have an entityIRI, does not have a get, indent is 0, and the parent path has a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        indent: 0,
                        path: ['recordId', 'iri']
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
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
                    expect(component.isShown(this.node)).toEqual(true);
                });
            });
            describe('when node has an entityIRI', function () {
                beforeEach(function() {
                    this.node = {entityIRI: 'id'};
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
            describe('when node has a get that returns false', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        get: jasmine.createSpy('get').and.returnValue(false)
                    };
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith();
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(this.node.get).toHaveBeenCalledWith();
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(component.isShown(this.node)).toEqual(false);
                    expect(this.node.get).toHaveBeenCalledWith();
                });
            });
            describe('when node indent is greater than 0 and areParentsOpen is false', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.iri'
                    };
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
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    expect(component.isShown(this.node)).toEqual(false);
                    expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                });
            });
            describe('when node indent is 0 and the parent path does not have a length of 2', function () {
                beforeEach(function() {
                    this.node = {
                        entityIRI: 'id',
                        indent: 0,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
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
            it('when all properties are filtered out', function() {
                const node: HierarchyNode = {
                    title: 'Properties',
                    get: jasmine.createSpy('get').and.returnValue(true),
                    set: jasmine.createSpy('set'),
                    entityIRI: '',
                    hasChildren: false,
                    indent: 0,
                    path: [],
                    entityInfo: undefined,
                    joinedPath: '',
                };
                component.filterText = 'text';
                component.preFilteredHierarchy = [node];
                expect(component.isShown(node)).toEqual(false);
            });
        });
        describe('openEntities filter', function() {
            beforeEach(function() {
                this.node = {};
            });
            it('node is open', function() {
                ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = true;
                expect(component.openEntities(this.node)).toEqual(true);
                expect(this.node.isOpened).toEqual(true);
                expect(this.node.displayNode).toEqual(true);
            });
            it('node is not open', function() {
                ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = false;
                expect(component.openEntities(this.node)).toEqual(true);
                expect(this.node.isOpened).toBeUndefined();
                expect(this.node.displayNode).toBeUndefined();
            });
        });
    });
});
