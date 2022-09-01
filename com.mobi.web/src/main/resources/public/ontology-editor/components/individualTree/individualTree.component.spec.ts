/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { IndividualTreeComponent } from './individualTree.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SharedModule } from '../../../shared/shared.module';
import { HierarchyFilterComponent } from '../hierarchyFilter/hierarchyFilter.component';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { cleanStylesFromDOM, mockUtil } from '../../../../../../test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

describe('Individual Tree component', function() {
    let component: IndividualTreeComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IndividualTreeComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let utilStub;
    
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                IndividualTreeComponent,
                MockComponent(HierarchyFilterComponent),
                MockComponent(TreeItemComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(IndividualTreeComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        ontologyManagerServiceStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get('utilService');

        ontologyStateServiceStub.listItem = new OntologyListItem();

        component.hierarchy = [{
            entityIRI: 'Class A',
            hasChildren: false,
            path: ['recordId', 'Class A'],
            indent: 0,
            isClass: true,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }, {
            entityIRI: 'Individual A1',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A1'],
            indent: 1,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }, {
            entityIRI: 'Individual A2',
            hasChildren: false,
            path: ['recordId', 'Class A', 'Individual A2'],
            indent: 1,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }, {
            entityIRI: 'Class B',
            hasChildren: true,
            path: ['recordId', 'Class B'],
            indent: 0,
            isClass: true,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }, {
            entityIRI: 'Class B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1'],
            indent: 1,
            isClass: true,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }, {
            entityIRI: 'Individual B1',
            hasChildren: false,
            path: ['recordId', 'Class B', 'Class B1', 'Individual B1'],
            indent: 2,
            entityInfo: {
                names: ['Title'],
                imported: false
            }
        }];
        component.index = 4;
        ontologyStateServiceStub.getActiveKey.and.returnValue('individuals');
        spyOn(component.updateSearch, 'emit');
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
        utilStub = null;
    });

    describe('controller bound variable', function() {
        it('hierarchy should be one way bound', function() {
            component.hierarchy = [];
            fixture.detectChanges();
            expect(component.hierarchy).toEqual([]);
        });
        it('index should be one way bound', function() {
            component.index = 0;
            fixture.detectChanges();
            expect(component.index).toEqual(0);
        });
        it('updateSearch is one way bound', function() {
            component.filterText = 'value';
            component.update();
            expect(component.updateSearch.emit).toHaveBeenCalledWith({value: 'value'});
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(component, 'isShown').and.returnValue(true);
            fixture.detectChanges();
        });
        it('with wrapping containers', function() {
            expect(element.queryAll(By.css('.tree')).length).toEqual(1);
            expect(element.queryAll(By.css('.individual-tree')).length).toEqual(1);
        });
        it('with a .repeater-container', function() {
            expect(element.queryAll(By.css('.repeater-container')).length).toEqual(1);
        });
        it('with tree-items', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.tree-item')).length).toEqual(2);
        });
        it('with a .tree-item-wrapper', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.tree-item-wrapper')).length).toEqual(2);
        });
    });
    describe('controller methods', function() {
        it('clickItem should call the correct method', function() {
            ontologyStateServiceStub.selectItem.and.returnValue(of(null));
            component.clickItem('iri');
            expect(ontologyStateServiceStub.selectItem).toHaveBeenCalledWith('iri');
        });
        it('toggleOpen should set the correct values', function() {
            spyOn(component, 'isShown').and.returnValue(false);
            var node = {isOpened: false, path: ['a', 'b'], joinedPath: 'a.b'};
            component.toggleOpen(node);
            expect(node.isOpened).toEqual(true);
            expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[node.joinedPath]).toEqual(true);
            expect(component.isShown).toHaveBeenCalled();
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
                this.filterNode = {
                    indent: 1,
                    entityIRI: 'iri',
                    hasChildren: false,
                    path: ['recordId', 'otherIri', 'iri'],
                    entityInfo: {
                        names: ['Title'],
                        imported: false
                    }
                };
                this.filterNodeParent = {
                    indent: 0,
                    entityIRI: 'otherIri',
                    hasChildren: true,
                    path: ['recordId', 'otherIri'],
                    imported: false
                };
                this.filterNodeClass = {
                    entityIRI: 'Class A',
                    hasChildren: false,
                    path: ['recordId', 'Class A'],
                    indent: 0,
                    isClass: true
                };
                component.hierarchy = [this.filterNodeParent, this.filterNode, this.filterNodeClass];
                component.filterText = 'ti';
                ontologyStateServiceStub.joinPath.and.callFake((path) => {
                    if (path === this.filterNode.path) {
                        return 'recordId.otherIri.iri';
                    } else if (path === this.filterNodeParent.path) {
                        return 'recordId.otherIri';
                    } else if (path === this.filterNodeClass.path) {
                        return 'recordId.Class A';
                    }
                });
                ontologyManagerServiceStub.entityNameProps = [DCTERMS + 'title'];
                ontologyStateServiceStub.joinPath.and.callFake((path) => join(path, '.'));
            });
            describe('has filter text', function() {
                describe('and the entity names', function() {
                    it('have at least one matching text value', function() {
                        expect(component.searchFilter(this.filterNode)).toEqual(true);
                        expect(ontologyStateServiceStub.listItem.editorTabStates[component.activeTab].open[this.filterNode.path[0] + '.' + this.filterNode.path[1]]).toEqual(true);
                    });
                    describe('do not have a matching text value', function () {
                        beforeEach(function () {
                            this.filterNode.entityInfo.names = [];
                        });
                        it('and does not have a matching entity local name', function () {
                            utilStub.getBeautifulIRI.and.returnValue('id');
                            expect(component.searchFilter(this.filterNode)).toEqual(false);
                        });
                        it('and does have a matching entity local name', function() {
                            utilStub.getBeautifulIRI.and.returnValue('title');
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
            describe('indent is greater than 0 and areParentsOpen is true', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.andAnotherIRI.iri'
                    };
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
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
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                    it('and does not have a child with a text match', function() {
                        expect(component.isShown(this.node)).toEqual(false);
                        expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
                    });
                });
                it('and filterText is not set and is not a parent node without a text match', function() {
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(true);
                    expect(component.isShown(this.node)).toEqual(true);
                    expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
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
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
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
            describe('indent is greater than 0 and areParentsOpen is false', function() {
                beforeEach(function() {
                    this.node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri'],
                        joinedPath: 'recordId.otherIRI.iri'
                    };
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
                });
                describe('and filterText is set and node is parent node without a text match', function() {
                    beforeEach(function() {
                        component.filterText = 'text';
                        this.node.parentNoMatch = true;
                        ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
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
                    ontologyStateServiceStub.areParentsOpen.and.returnValue(false);
                    expect(component.isShown(this.node)).toEqual(false);
                    expect(ontologyStateServiceStub.areParentsOpen).toHaveBeenCalledWith(this.node, component.activeTab);
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
