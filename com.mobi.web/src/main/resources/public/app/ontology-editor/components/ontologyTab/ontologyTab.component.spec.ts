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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyButtonStackComponent } from '../ontologyButtonStack/ontologyButtonStack.component';
import { ProjectTabComponent } from '../projectTab/projectTab.component';
import { SearchTabComponent } from '../searchTab/searchTab.component';
import { VisualizationTabComponent } from '../visualizationTab/visualizationTab.component';
import { ClassesTabComponent } from '../classesTab/classesTab.component';
import { PropertiesTabComponent } from '../propertiesTab/propertiesTab.component';
import { OverviewTabComponent } from '../overviewTab/overviewTab.component';
import { ConceptSchemesTabComponent } from '../conceptSchemesTab/conceptSchemesTab.component';
import { ConceptsTabComponent } from '../conceptsTab/conceptsTab.component';
import { SeeHistoryComponent } from '../seeHistory/seeHistory.component';
import { IndividualsTabComponent } from '../individualsTab/individualsTab.component';
import { OntologyTabComponent } from './ontologyTab.component';

describe('Ontology Tab component', function() {
    let component: OntologyTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const recordId = 'recordId';
    const branchId = 'masterId';
    const commitId = 'commitId';
    const commit: CommitDifference = new CommitDifference();
    commit.commit = {
        '@id': commitId
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatTabsModule,
                MatMenuModule
            ],
            declarations: [
                OntologyTabComponent,
                MockComponent(OntologyButtonStackComponent),
                MockComponent(OverviewTabComponent),
                MockComponent(ClassesTabComponent),
                MockComponent(PropertiesTabComponent),
                MockComponent(ProjectTabComponent),
                MockComponent(ConceptsTabComponent),
                MockComponent(ConceptSchemesTabComponent),
                MockComponent(SearchTabComponent),
                MockComponent(ClassesTabComponent),
                MockComponent(VisualizationTabComponent),
                MockComponent(SeeHistoryComponent),
                MockComponent(IndividualsTabComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
        ontologyStateStub.setSelected.and.returnValue(of(null));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('should destroy correctly', function() {
        ontologyStateStub.listItem.openSnackbar = jasmine.createSpyObj('MatSnackBar', ['dismiss']);
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.openSnackbar.dismiss).toHaveBeenCalledWith();
    });
    describe('controller method', function() {
        it('onTabChanged handles a tab change', function() {
            ontologyStateStub.setSelected.and.returnValue(of(null));
            [
                { index: 0, key: 'project', bool: false, comp: true }, 
                { index: 1, key: 'overview', bool: true, comp: true }, 
                { index: 2, key: 'classes', bool: true, comp: true }, 
                { index: 3, key: 'properties', bool: true, comp: true }, 
                { index: 4, key: 'individuals', bool: false, comp: true }, 
                { index: 5, key: 'schemes', bool: false, comp: true }, 
                { index: 6, key: 'concepts', bool: false, comp: true }, 
                { index: 7, key: 'search', bool: false }, 
                { index: 8 }, 
            ].forEach(test => {
                ontologyStateStub.setSelected.calls.reset();
                const event = new MatTabChangeEvent();
                event.index = test.index;
                component.onTabChanged(event);
                if (test.key) {
                    if (test.comp) {
                        expect(ontologyStateStub.setSelected).toHaveBeenCalledWith(ontologyStateStub.listItem.editorTabStates[test.key].entityIRI, test.bool, ontologyStateStub.listItem, undefined);
                    } else {
                        expect(ontologyStateStub.setSelected).toHaveBeenCalledWith(ontologyStateStub.listItem.editorTabStates[test.key].entityIRI, test.bool);
                    }
                } else {
                    expect(ontologyStateStub.setSelected).not.toHaveBeenCalled();
                }
            });
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
            ontologyStateStub.listItem.isVocabulary = false;
            component.isVocab = false;
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.main-tabs')).length).toEqual(1);
        });
        ['mat-tab-group', 'ontology-button-stack'].forEach(tag => {
            it(`with a ${tag}`, function() {
                expect(element.queryAll(By.css(tag)).length).toEqual(1);
            });
        });
        it('with tabs', function() {
            expect(element.queryAll(By.css('mat-tab-body')).length).toEqual(9);
        });
        it('with a tab for project-tab', function() {
            expect(element.queryAll(By.css('project-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for overview-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 1;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('overview-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for classes-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 2;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('classes-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for properties-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 3;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('properties-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for individuals-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 4;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('individuals-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for concept-schemes-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 5;
            ontologyStateStub.listItem.isVocabulary = true;
            component.isVocab = true;
            const change = new SimpleChange(null, ontologyStateStub.listItem.isVocabulary, false);
            component.ngOnChanges({isVocab: change});
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('concept-schemes-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(0);
        });
        it('with a tab for concepts-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 6;
            ontologyStateStub.listItem.isVocabulary = true;
            component.isVocab = true;
            const change = new SimpleChange(null, ontologyStateStub.listItem.isVocabulary, false);
            component.ngOnChanges({isVocab: change});
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('concepts-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(0);
        });
        it('with a tab for search-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 7;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('search-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for visualization-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 8;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('visualization-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('if the history of an entity is being viewed', function() {
            expect(element.queryAll(By.css('see-history')).length).toEqual(0);
            ontologyStateStub.listItem.seeHistory = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(0);
            expect(element.queryAll(By.css('ontology-button-stack')).length).toEqual(0);
            expect(element.queryAll(By.css('see-history')).length).toEqual(1);
        });
    });
    describe('should update the search index when', function() {
       beforeEach(function() {
           ontologyStateStub.listItem.tabIndex = 7;
           fixture.detectChanges();
           const optionsButton = element.queryAll(By.css('.search-options'))[0];
           optionsButton.triggerEventHandler('click', null);
           fixture.detectChanges();
       });
        it('the find button is clicked', function() {
            const button = element.queryAll(By.css('.find-button'))[0];
            button.triggerEventHandler('click', null);
            expect(ontologyStateStub.listItem.editorTabStates.search.openIndex).toEqual(0);
        });
        it('the query button is clicked', function() {
            const button = element.queryAll(By.css('.query-button'))[0];
            button.triggerEventHandler('click', {});
            expect(ontologyStateStub.listItem.editorTabStates.search.openIndex).toEqual(1);
        });
    });
});
