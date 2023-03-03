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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS, ONTOLOGYSTATE } from '../../../prefixes';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { State } from '../../../shared/models/state.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CommitsTabComponent } from '../commitsTab/commitsTab.component';
import { OntologyButtonStackComponent } from '../ontologyButtonStack/ontologyButtonStack.component';
import { ProjectTabComponent } from '../projectTab/projectTab.component';
import { SavedChangesTabComponent } from '../savedChangesTab/savedChangesTab.component';
import { SearchTabComponent } from '../searchTab/searchTab.component';
import { VisualizationTabComponent } from '../visualizationTab/visualizationTab.component';
import { ClassesTabComponent } from '../classesTab/classesTab.component';
import { MergeTabComponent } from '../mergeTab/mergeTab.component';
import { PropertiesTabComponent } from '../propertiesTab/propertiesTab.component';
import { OverviewTabComponent } from '../overviewTab/overviewTab.component';
import { ConceptSchemesTabComponent } from '../conceptSchemesTab/conceptSchemesTab.component';
import { ConceptsTabComponent } from '../conceptsTab/conceptsTab.component';
import { SeeHistoryComponent } from '../seeHistory/seeHistory.component';
import { IndividualsTabComponent } from '../individualsTab/individualsTab.component';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyTabComponent } from './ontologyTab.component';

describe('Ontology Tab component', function() {
    let component: OntologyTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'error message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'masterId';
    const commitId = 'commitId';
    const branch: JSONLDObject = {
        '@id': branchId,
        [DCTERMS + 'title']: [{
            '@value': 'MASTER'
        }]
    };
    const commit: CommitDifference = new CommitDifference();
    commit.commit = {
        '@id': commitId
    };
    const branchState: JSONLDObject = {
        '@id': 'stateId',
        [ONTOLOGYSTATE + 'branch']: [{'@id': branchId}]
    };
    const state: State = {
        id: '',
        model: [branchState]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatTabsModule,
            ],
            declarations: [
                OntologyTabComponent,
                MockComponent(OntologyButtonStackComponent),
                MockComponent(MergeTabComponent),
                MockComponent(OverviewTabComponent),
                MockComponent(ClassesTabComponent),
                MockComponent(PropertiesTabComponent),
                MockComponent(ProjectTabComponent),
                MockComponent(ConceptsTabComponent),
                MockComponent(ConceptSchemesTabComponent),
                MockComponent(CommitsTabComponent),
                MockComponent(SavedChangesTabComponent),
                MockComponent(SearchTabComponent),
                MockComponent(ClassesTabComponent),
                MockComponent(VisualizationTabComponent),
                MockComponent(SeeHistoryComponent),
                MockComponent(IndividualsTabComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.branches = [branch];
        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
        ontologyStateStub.updateOntology.and.returnValue(of(null));
        ontologyStateStub.setSelected.and.returnValue(of(null));
    
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(undefined));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('should initialize calling the correct methods', function() {
        beforeEach(function() {
            ontologyStateStub.updateOntology.calls.reset();
            ontologyStateStub.resetStateTabs.calls.reset();
            utilStub.getDctermsValue.and.returnValue('MASTER');
        });
        describe('when the ontology is open on a branch', function() {
            describe('and the branch does not exist', function() {
                beforeEach(function() {
                    ontologyStateStub.listItem.versionedRdfRecord.branchId = 'not exist';
                    ontologyStateStub.getStateByRecordId.and.returnValue(state);
                    utilStub.getPropertyId.and.returnValue(commitId);
                });
                describe('and getBranchHeadCommit is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(commit));
                    });
                    it('and updateOntology is resolved', fakeAsync(function() {
                        ontologyStateStub.updateOntology.and.returnValue(of(null));
                        component.ngOnInit();
                        tick();
                        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
                        expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(branchState, ONTOLOGYSTATE + 'commit');
                        expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(recordId, branchId, commitId, true);
                        expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith();
                        expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('and updateOntology does not resolve', fakeAsync(function() {
                        ontologyStateStub.updateOntology.and.returnValue(throwError(error));
                        component.ngOnInit();
                        tick();
                        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
                        expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(branchState, ONTOLOGYSTATE + 'commit');
                        expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId, catalogId);
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(recordId, branchId, commitId, true);
                        expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                    }));
                });
                it('and getBranchHeadCommit does not resolve', fakeAsync(function() {
                    catalogManagerStub.getBranchHeadCommit.and.returnValue(throwError(error));
                    component.ngOnInit();
                    tick();
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
                    expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(branchState, ONTOLOGYSTATE + 'commit');
                    expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(branchId, recordId, catalogId);
                    expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                    expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
            it('and the branch exists', fakeAsync(function() {
                ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
                component.ngOnInit();
                tick();
                expect(catalogManagerStub.getBranchHeadCommit).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        it('when the ontology is not open on a branch', fakeAsync(function() {
            component.ngOnInit();
            tick();
            expect(catalogManagerStub.getBranchHeadCommit).not.toHaveBeenCalled();
            expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
            expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
        }));
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
                { index: 9 }, 
                { index: 10 }
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
            it('with a ' + tag, function() {
                expect(element.queryAll(By.css(tag)).length).toEqual(1);
            });
        });
        it('with tabs', function() {
            expect(element.queryAll(By.css('mat-tab-body')).length).toEqual(11);
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
        it('with a tab for saved-changes-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 8;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('saved-changes-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for commits-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 9;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('commits-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('with a tab for visualization-tab', async function() {
            ontologyStateStub.listItem.tabIndex = 11;
            fixture.detectChanges();
            await fixture.isStable();
            expect(element.queryAll(By.css('visualization-tab')).length).toBe(1);
            expect(element.queryAll(By.css('div.mat-tab-label[aria-labelledby=hidden]')).length).toBe(2);
        });
        it('if branches are being merged', function() {
            expect(element.queryAll(By.css('merge-tab')).length).toEqual(0);

            ontologyStateStub.listItem.merge.active = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(0);
            expect(element.queryAll(By.css('ontology-button-stack')).length).toEqual(0);
            expect(element.queryAll(By.css('merge-tab')).length).toEqual(1);
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
});
