/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { HierarchyFilterComponent } from '../hierarchyFilter/hierarchyFilter.component';
import { SharedModule } from '../../../shared/shared.module';
import { DCTERMS } from '../../../prefixes';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { HierarchyTreeComponent } from './hierarchyTree.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

describe('Hierarchy Tree component', function() {
    let component: HierarchyTreeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<HierarchyTreeComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule, ScrollingModule ],
            declarations: [
                HierarchyTreeComponent,
                MockComponent(TreeItemComponent),
                MockComponent(HierarchyFilterComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(HierarchyTreeComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.listItem = new OntologyListItem();
        component.hierarchy = [{
            entityIRI: 'class1',
            indent: 0,
            path: [],
            hasChildren: true,
            joinedPath: '',
            entityInfo: {
                label: 'class1',
                names: ['class1'],
            }
        }, {
            entityIRI: 'class2',
            indent: 1,
            path: [],
            hasChildren: false,
            joinedPath: '',
            entityInfo: {
                label: 'class2',
                names: ['class2'],
            }
        }, {
            entityIRI: 'class3',
            indent: 0,
            path: [],
            hasChildren: false,
            joinedPath: '',
            entityInfo: {
                label: 'class3',
                names: ['class3'],
            }
        }];
        ontologyStateStub.getActiveKey.and.returnValue('classes');
        component.index = 0;
        component.filterText = '';
        component.searchText = '';
        spyOn(component.resetIndex, 'emit');
        component.ngOnInit();
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        ontologyStateStub = null;
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        beforeEach(async function() {
            fixture.detectChanges();
            await fixture.whenStable();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.hierarchy-tree')).length).toEqual(1);
        });
        it('based on .repeater-container', function() {
            expect(element.queryAll(By.css('.repeater-container')).length).toEqual(1);
        });
        it('based on tree-items', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('tree-item')).length).toEqual(2);
        });
        it('based on .tree-item-wrapper', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.tree-item-wrapper')).length).toEqual(2);
        });
    });
    describe('controller methods', function() {
        it('clickItem should call the correct method', function() {
            ontologyStateStub.selectItem.and.returnValue(of(null));
            component.clickItem('iri');
            expect(ontologyStateStub.selectItem).toHaveBeenCalledWith('iri');
        });
        it('toggleOpen should set the correct values', function() {
            spyOn(component, 'isShown').and.returnValue(false);
            component.preFilteredHierarchy = component.hierarchy;
            const node: HierarchyNode = {
                isOpened: false, path: ['a', 'b'], joinedPath: 'a.b',
                entityIRI: '',
                hasChildren: false,
                indent: 0,
                entityInfo: {
                    label: 'class3',
                    names: ['class3'],
                }
            };
            component.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateStub.listItem.editorTabStates[component.activeTab].open[node.joinedPath]).toEqual(true);
            expect(component.isShown).toHaveBeenCalledWith(true, jasmine.any(Object));
            expect(component.filteredHierarchy).toEqual([]);
        });
        describe('matchesDropdownFilters', function() {
            beforeEach(function() {
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    joinedPath: 'recordId.otherIri.iri',
                    entity: {}
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
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entityInfo: {
                        names: ['Title']
                    }
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri'],
                    entityInfo: {
                        label: 'parent',
                        names: ['parent'],
                    }
                };
                component.hierarchy = [this.filterNodeParent, this.filterNode];
                component.filterText = 'class';
                ontologyStateStub.joinPath.and.callFake((path) => join(path, '.'));
            });
            describe('has filter text', function() {
                describe('and the entity names', function() {
                    it('have at least one matching text value', function() {
                        component.filterText = 'title';
                        expect(component.searchFilter(this.filterNode)).toEqual(true);
                        expect(ontologyStateStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                    });
                    describe('do not have a matching text value', function () {
                        beforeEach(function () {
                            this.filterNode.entityInfo.names = [];
                        });
                        it('and does not have a matching entity local name', function () {
                            component.filterText = 'fail';
                            expect(component.searchFilter(this.filterNode)).toEqual(false);
                        });
                        it('and does have a matching entity local name', function() {
                            component.filterText = 'iri';
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
        describe('the active entity filter', function() {
            beforeEach(function() {
                this.importedNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:id',
                        [`${DCTERMS}title`]: [{'@value': 'Title'}]
                    }
                };
                this.activeEntityNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entity: {
                        '@id': 'urn:id',
                        [`${DCTERMS}title`]: [{'@value': 'Title'}]
                    }
                };
            });
            it('matches when an entity is not imported', function() {
                expect(component.activeEntityFilter.filter(this.activeEntityNode)).toEqual(true);
            });
            it('does not match when an entity imported', function() {
                ontologyStateStub.isImported.and.returnValue(true);
                expect(component.activeEntityFilter.filter(this.importedNode)).toEqual(false);
            });
        });
        describe('isShown filter', function () {
            describe('indent is greater than 0 and areParentsOpen is true', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.andAnotherIRI.iri'
                    };
                    ontologyStateStub.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateStub.areParentsOpen.and.returnValue(true);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(true, this.node)).toEqual(true);
                        expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(true, this.node)).toEqual(false);
                        expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateStub.areParentsOpen.and.returnValue(true);
                    expect(component.isShown(true, this.node)).toEqual(true);
                    expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                });
            });
            describe('indent is 0', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'iri'],
                        joinedPath: 'recordId.iri'
                    };
                    ontologyStateStub.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        ontologyStateStub.areParentsOpen.and.returnValue(true);
                        expect(component.isShown(true, this.node)).toEqual(true);
                    });
                    it('and does not have a child with a text match', function() {
                        ontologyStateStub.areParentsOpen.and.returnValue(false);
                        expect(component.isShown(true, this.node)).toEqual(false);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateStub.areParentsOpen.and.returnValue(true);
                    expect(component.isShown(true, this.node)).toEqual(true);
                });
            });
            describe('indent is greater than 0 and areParentsOpen is false', function () {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.iri'
                    };
                    ontologyStateStub.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateStub.areParentsOpen.and.returnValue(false);
                    });
                    it('and has a child that has a text match', function() {
                        this.node.displayNode = true;
                        expect(component.isShown(true, this.node)).toEqual(false);
                        expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(true, this.node)).toEqual(false);
                        expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateStub.areParentsOpen.and.returnValue(false);
                    expect(component.isShown(true, this.node)).toEqual(false);
                    expect(ontologyStateStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                });
            });
        });
        describe('openEntities filter', function() {
            beforeEach(function() {
                this.node = {};
            });
            it('node is open', function() {
                ontologyStateStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = true;
                expect(component.openEntities(true, this.node)).toEqual(true);
                expect(this.node.isOpened).toEqual(true);
                expect(this.node.displayNode).toEqual(true);
            });
            it('node is not open', function() {
                ontologyStateStub.listItem.editorTabStates[component.activeTab].open[this.node.title] = false;
                expect(component.openEntities(true, this.node)).toEqual(true);
                expect(this.node.isOpened).toBeUndefined();
                expect(this.node.displayNode).toBeUndefined();
            });
        });
    });
});
