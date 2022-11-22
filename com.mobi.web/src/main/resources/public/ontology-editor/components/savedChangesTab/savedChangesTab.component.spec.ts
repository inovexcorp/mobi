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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatExpansionModule, MatIconModule, MatExpansionPanel } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { range, remove } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { CommitCompiledResourceComponent } from '../../../shared/components/commitCompiledResource/commitCompiledResource.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
import { SavedChangesTabComponent } from './savedChangesTab.component';

describe('Saved Changes Tab component', function() {
    let component: SavedChangesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SavedChangesTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const commitId = 'commitId';
    const newBranchId = 'newBranchId';
    const userBranchId = 'userBranchId';
    const otherUserBranchId = 'otherUserBranchId';
    const createdFromId = 'createdFromId';
    const branchTitle = 'branchA';
    const branchDescription = 'branchDescription';
    const obj: JSONLDObject = {
        '@id': 'obj'
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatIconModule,
                MatExpansionModule
            ],
            declarations: [
                SavedChangesTabComponent,
                MockComponent(InfoMessageComponent),
                MockComponent(ErrorDisplayComponent),
                MockComponent(CommitCompiledResourceComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.localCatalog = {'@id': catalogId};

        fixture = TestBed.createComponent(SavedChangesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get(UtilService);

        ontologyStateStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('should update the list of changes when additions/deletions change', function() {
        beforeEach(function() {
            ontologyStateStub.getEntityNameByListItem.and.returnValue('name');
        });
        it('if there are less than 100 changes', function() {
            component.difference = new Difference(
                [{'@id': '1', 'value': ['stuff']}],
                [{'@id': '1', 'value': ['otherstuff']}, {'@id': '2'}]
            );
            component.ngOnChanges();
            expect(component.showList).toEqual([
                {id: '1', entityName: 'name', difference: new Difference([{'@id': '1', 'value': ['stuff']}], [{'@id': '1', 'value': ['otherstuff']}]), disableAll: false},
                {id: '2', entityName: 'name', difference: new Difference([], [{'@id': '2'}]), disableAll: false},
            ]);
        });
        it('if there are more than 100 changes', function() {
            const ids = range(102);
            component.difference = new Difference(ids.map(id => ({'@id': '' + id})));
            component.ngOnChanges();
            expect(component.showList.length).toEqual(100);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.saved-changes-tab')).length).toEqual(1);
        });
        it('if there are changes', function() {
            expect(element.queryAll(By.css('.has-changes')).length).toEqual(0);
            expect(element.queryAll(By.css('.btn-container')).length).toEqual(0);
            expect(element.queryAll(By.css('.btn-container button')).length).toEqual(0);
            expect(element.queryAll(By.css('.changes')).length).toEqual(0);

            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.has-changes')).length).toEqual(1);
            expect(element.queryAll(By.css('.btn-container')).length).toEqual(1);
            expect(element.queryAll(By.css('.btn-container button')).length).toEqual(1);
            expect(element.queryAll(By.css('.changes')).length).toEqual(1);
        });
        it('depending on how many additions/deletions there are', async function() {
            expect(element.queryAll(By.css('mat-accordion')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-expansion-panel')).length).toEqual(0);
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(0);

            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            component.showList = [
                {id: obj['@id'], entityName: '', difference: new Difference([obj], [obj]), disableAll: false},
                {id: obj['@id'], entityName: '', difference: new Difference([obj, obj]), disableAll: false}
            ];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-accordion')).length).toEqual(2);
            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(2);
        });
        it('depending on whether there are more changes to show', function() {
            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.changes button')).length).toEqual(0);

            const item = {id: obj['@id'], entityName: '', difference: new Difference([obj], [obj]), disableAll: false};
            component.showList = [item];
            component.list = [item, item];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.changes button')).length).toEqual(1);
        });
        it('depending on whether the list item is up to date', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-changes info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.changes .text-center error-display')).length).toEqual(0);

            ontologyStateStub.listItem.upToDate = false;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-changes info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('.no-changes error-display')).length).toEqual(1);

            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.changes-info error-display')).length).toEqual(1);

            ontologyStateStub.listItem.upToDate = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.changes-info error-display')).length).toEqual(0);
        });
        it('depending on whether the branch is a user branch', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-changes info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.no-changes error-display')).length).toEqual(0);

            ontologyStateStub.listItem.userBranch = true;
            ontologyStateStub.listItem.createdFromExists = true;
            fixture.detectChanges();

            expect(element.queryAll(By.css('.no-changes info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('.no-changes error-display')).length).toEqual(1);

            ontologyStateStub.listItem.createdFromExists = true;
            fixture.detectChanges();

            expect(element.queryAll(By.css('.no-changes info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('.no-changes error-display')).length).toEqual(1);
        });
        it('depending on whether the list item is committable', function() {
            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            fixture.detectChanges();
            const button = element.queryAll(By.css('button[color="warn"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();

            ontologyStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should go to a specific entity', function() {
            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');
            component.go(event, 'A');
            expect(event.stopPropagation).toHaveBeenCalledWith();
            expect(ontologyStateStub.goTo).toHaveBeenCalledWith('A');
        });
        describe('should update the selected ontology', function() {
            beforeEach(function() {
                const commit = new CommitDifference();
                commit.commit = {'@id': commitId};
                catalogManagerStub.getBranchHeadCommit.and.returnValue(of(commit));
            });
            it('unless an error occurs', fakeAsync(function() {
                ontologyStateStub.updateOntology.and.returnValue(throwError(error));
                component.update();
                tick();
                expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(String));
                expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, commitId);
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            it('successfully', fakeAsync(function() {
                ontologyStateStub.updateOntology.and.returnValue(of(null));
                component.update();
                tick();
                expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(String));
                expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, commitId);
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        describe('restoreBranchWithUserBranch calls the correct method', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
                this.newBranch = {
                    '@id': newBranchId,
                    [CATALOG + 'head']: [{'@id': commitId}],
                    [DCTERMS + 'title']: [{'@value': branchTitle}],
                    [DCTERMS + 'description']: [{'@value': branchDescription}]
                };

                this.userBranch = {
                    '@id': userBranchId,
                    '@type': [CATALOG + 'UserBranch'],
                    [CATALOG + 'head']: [{'@id': commitId}],
                    [CATALOG + 'createdFrom']: [{'@id': createdFromId}],
                    [DCTERMS + 'title']: [{'@value': branchTitle}],
                    [DCTERMS + 'description']: [{'@value': branchDescription}]
                };

                this.otherUserBranch = {
                    '@id': otherUserBranchId,
                    '@type': [CATALOG + 'UserBranch'],
                    [CATALOG + 'head']: [{'@id': commitId}],
                    [CATALOG + 'createdFrom']: [{'@id': createdFromId}],
                    [DCTERMS + 'title']: [{'@value': branchTitle}],
                    [DCTERMS + 'description']: [{'@value': branchDescription}]
                };

                ontologyStateStub.listItem.versionedRdfRecord.branchId = userBranchId;
                ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                ontologyStateStub.listItem.versionedRdfRecord.commitId = commitId;
                ontologyStateStub.listItem.branches.push(this.userBranch);
                ontologyStateStub.listItem.branches.push(this.otherUserBranch);

                this.branchConfig = {
                    title: branchTitle,
                    description: branchDescription
                };

                utilStub.getPropertyId.and.callFake((branch, prop) => {
                    if (prop === CATALOG + 'createdFrom') {
                        return createdFromId;
                    } else if (prop === CATALOG + 'head') {
                       return commitId;
                   }
                });

                utilStub.getDctermsValue.and.callFake((branch, prop) => {
                    if (prop === 'title') {
                        return branchTitle;
                    } else if (prop === 'description') {
                        return branchDescription;
                    }
                });
            });
            describe('when createRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerStub.createRecordBranch.and.returnValue(of(newBranchId));
                });
                describe('and when getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(of(this.newBranch));
                    });
                    describe('and when updateState is resolved', function() {
                        beforeEach(function() {
                            ontologyStateStub.updateState.and.returnValue(of(null));
                            catalogManagerStub.isUserBranch.and.callFake(branchToCheck => branchToCheck['@id'] === otherUserBranchId);
                        });
                        describe('and when deleteOntologyBranch is resolved', function() {
                            beforeEach(() => {
                                ontologyManagerStub.deleteOntologyBranch.and.returnValue(of(null));
                            });
                            it('and when deleteBranchState is resolved', fakeAsync(function() {
                                ontologyStateStub.deleteBranchState.and.returnValue(of(null));
                                ontologyStateStub.listItem.versionedRdfRecord.branchId = newBranchId;
                                remove(ontologyStateStub.listItem.branches, branch => branch['@id'] === userBranchId);
                                ontologyStateStub.removeBranch.and.returnValue(of(null));
                                catalogManagerStub.updateRecordBranch.and.returnValue(of(null));
                                component.restoreBranchWithUserBranch();
                                tick();
                                expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                                expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: newBranchId});
                                expect(ontologyStateStub.deleteBranchState).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, newBranchId);
                                expect(ontologyStateStub.removeBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, newBranchId);
                                expect(catalogManagerStub.updateRecordBranch).toHaveBeenCalledWith(otherUserBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.otherUserBranch);
                            }));
                            it('and when deleteBranchState is rejected', fakeAsync(function() {
                                ontologyStateStub.deleteBranchState.and.returnValue(throwError(error));
                                component.restoreBranchWithUserBranch();
                                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                                tick();
                            }));
                        });
                        it('and when deleteOntologyBranch is rejected', fakeAsync(function() {
                            ontologyManagerStub.deleteOntologyBranch.and.returnValue(throwError(error));
                            component.restoreBranchWithUserBranch();
                            tick();
                            expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                        }));
                    });
                    it('and when updateState is rejected', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(throwError(error));
                        component.restoreBranchWithUserBranch();
                        tick();
                        expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: newBranchId});
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                    }));
                });
                it('and when getRecordBranch is rejected', fakeAsync(function() {
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                    component.restoreBranchWithUserBranch();
                    tick();
                    expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
            it('when createRecordBranch is rejected', fakeAsync(function() {
                catalogManagerStub.createRecordBranch.and.returnValue(throwError(error));
                component.restoreBranchWithUserBranch();
                tick();
                expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        describe('mergeUserBranch calls the correct methods', function() {
            beforeEach(function() {
                this.source = {'@id': 'source'};
                this.target = {'@id': 'target'};
                ontologyStateStub.listItem.branches = [this.source, this.target];
                utilStub.getPropertyId.and.returnValue(this.target['@id']);
                ontologyStateStub.checkConflicts.and.returnValue(of(null));
            });
            describe('when checkConflicts is resolved', function() {
                it('and when merge is resolved', fakeAsync(function() {
                    ontologyStateStub.merge.and.returnValue(of(null));
                    component.mergeUserBranch();
                    tick();
                    expect(ontologyStateStub.listItem.merge.target).toEqual(this.target);
                    expect(ontologyStateStub.listItem.merge.checkbox).toEqual(true);
                    expect(ontologyStateStub.listItem.merge.active).toEqual(false);
                    expect(ontologyStateStub.checkConflicts).toHaveBeenCalledWith();
                    expect(ontologyStateStub.merge).toHaveBeenCalledWith();
                    expect(ontologyStateStub.cancelMerge).toHaveBeenCalledWith();
                    expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith();
                    expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('and when merge is rejected', fakeAsync(function() {
                    ontologyStateStub.merge.and.returnValue(throwError(error));
                    component.mergeUserBranch();
                    tick();
                    expect(ontologyStateStub.listItem.merge.target).toEqual(this.target);
                    expect(ontologyStateStub.listItem.merge.checkbox).toEqual(true);
                    expect(ontologyStateStub.listItem.merge.active).toEqual(false);
                    expect(ontologyStateStub.checkConflicts).toHaveBeenCalledWith();
                    expect(ontologyStateStub.merge).toHaveBeenCalledWith();
                    expect(ontologyStateStub.cancelMerge).toHaveBeenCalledWith();
                    expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                    expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Pulling changes failed');
                }));
            });
            it('when checkConflicts is rejected', fakeAsync(function() {
                ontologyStateStub.checkConflicts.and.returnValue(throwError(error));
                component.mergeUserBranch();
                tick();
                expect(ontologyStateStub.listItem.merge.target).toEqual(this.target);
                expect(ontologyStateStub.listItem.merge.checkbox).toEqual(true);
                expect(ontologyStateStub.listItem.merge.active).toEqual(true);
                expect(ontologyStateStub.checkConflicts).toHaveBeenCalledWith();
                expect(ontologyStateStub.merge).not.toHaveBeenCalled();
                expect(ontologyStateStub.cancelMerge).not.toHaveBeenCalled();
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        describe('removeChanges calls the correct manager methods and sets the correct variables', function() {
            beforeEach(function() {
                ontologyStateStub.listItem.inProgressCommit.additions = [obj];
                ontologyStateStub.listItem.inProgressCommit.deletions = [obj];
                component.catalogId = catalogId;
            });
            describe('when deleteInProgressCommit resolves', function() {
                beforeEach(function() {
                    catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
                });
                it('and updateOntology resolves', fakeAsync(function() {
                    ontologyStateStub.updateOntology.and.returnValue(of(null));
                    component.index = 100;
                    component.removeChanges();
                    tick();
                    expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                    expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, ontologyStateStub.listItem.upToDate);
                    expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith();
                    expect(ontologyStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                    expect(component.index).toEqual(0);
                }));
                it('and updateOntology rejects', fakeAsync(function() {
                    ontologyStateStub.updateOntology.and.returnValue(throwError(error));
                    component.index = 100;
                    component.removeChanges();
                    tick();
                    expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                    expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith();
                    expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, ontologyStateStub.listItem.upToDate);
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                    expect(component.index).toEqual(100);
                }));
            });
            it('when deleteInProgressCommit rejects', fakeAsync(function() {
                catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(error));
                component.index = 100;
                component.removeChanges();
                tick();
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(component.index).toEqual(100);
            }));
        });
        it('getEntityName should call the correct method', function() {
            ontologyStateStub.getEntityNameByListItem.and.returnValue('iri');
            expect(component.getEntityName('id')).toEqual('iri');
            expect(ontologyStateStub.getEntityNameByListItem).toHaveBeenCalledWith('id');
        });
    });
    it('should call update when the link is clicked', function() {
        ontologyStateStub.listItem.upToDate = false;
        fixture.detectChanges();
        spyOn(component, 'update');
        const link = element.queryAll(By.css('.no-changes error-display a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.update).toHaveBeenCalledWith();
    });
    it('should call mergeUserBranch when the link is clicked', function() {
        ontologyStateStub.listItem.userBranch = true;
        ontologyStateStub.listItem.createdFromExists = true;
        fixture.detectChanges();
        spyOn(component, 'mergeUserBranch');
        const link = element.queryAll(By.css('.no-changes error-display a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.mergeUserBranch).toHaveBeenCalledWith();
    });
    it('should call restoreBranchWithUserBranch when the link is clicked', function() {
        ontologyStateStub.listItem.userBranch = true;
        ontologyStateStub.listItem.createdFromExists = false;
        fixture.detectChanges();
        spyOn(component, 'restoreBranchWithUserBranch');
        const link = element.queryAll(By.css('.no-changes error-display a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.restoreBranchWithUserBranch).toHaveBeenCalledWith();
    });
});
