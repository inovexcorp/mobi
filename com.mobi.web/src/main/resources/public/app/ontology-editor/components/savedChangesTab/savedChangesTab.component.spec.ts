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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { range } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
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
import { ToastService } from '../../../shared/services/toast.service';
import { SavedChangesTabComponent } from './savedChangesTab.component';

describe('Saved Changes Tab component', function() {
    let component: SavedChangesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SavedChangesTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

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
    const branch = {
        '@id': 'branch123',
        [`${CATALOG}head`]: [{'@id': 'commit123'}],
        [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
    };
    const branches = [branch];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatButtonModule,
                MatIconModule,
                MatExpansionModule,
                MatSlideToggleModule
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
                MockProvider(ToastService),
            ]
        }).compileComponents();

        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': catalogId, data: branches}]})));
        catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': 'urn:tag'}]})));
        
        fixture = TestBed.createComponent(SavedChangesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        ontologyStateStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        catalogManagerStub = null;
        toastStub = null;
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
                {id: '1', entityName: 'name', difference: new Difference([{'@id': '1', 'value': ['stuff']}], [{'@id': '1', 'value': ['otherstuff']}]), disableAll: false, resource: undefined, showFull: false, isBlankNode: false},
                {id: '2', entityName: 'name', difference: new Difference([], [{'@id': '2'}]), disableAll: false, resource: undefined, showFull: false, isBlankNode: false},
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
            expect(element.queryAll(By.css('mat-slide-toggle')).length).toEqual(0);
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(0);

            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            component.showList = [
                {id: obj['@id'], entityName: '', difference: new Difference([obj], [obj]), disableAll: false, resource: undefined, showFull: false, isBlankNode: false},
                {id: obj['@id'], entityName: '', difference: new Difference([obj, obj]), disableAll: false, resource: undefined, showFull: false, isBlankNode: true}
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
            expect(element.queryAll(By.css('mat-slide-toggle')).length).toEqual(1);
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(2);
        });
        it('depending on whether there are more changes to show', function() {
            ontologyStateStub.listItem.inProgressCommit.additions = [obj];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.changes button')).length).toEqual(0);

            const item = {id: obj['@id'], entityName: '', difference: new Difference([obj], [obj]), disableAll: false, resource: undefined, showFull: false, isBlankNode: false};
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
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            it('successfully', fakeAsync(function() {
                ontologyStateStub.updateOntology.and.returnValue(of(null));
                component.update();
                tick();
                expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(String));
                expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, commitId);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        describe('restoreBranchWithUserBranch calls the correct method', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
                this.newBranch = {
                    '@id': newBranchId,
                    [`${CATALOG}head`]: [{'@id': commitId}],
                    [`${DCTERMS}title`]: [{'@value': branchTitle}],
                    [`${DCTERMS}description`]: [{'@value': branchDescription}]
                };

                this.userBranch = {
                    '@id': userBranchId,
                    '@type': [`${CATALOG}UserBranch`],
                    [`${CATALOG}head`]: [{'@id': commitId}],
                    [`${CATALOG}createdFrom`]: [{'@id': createdFromId}],
                    [`${DCTERMS}title`]: [{'@value': branchTitle}],
                    [`${DCTERMS}description`]: [{'@value': branchDescription}]
                };

                this.otherUserBranch = {
                    '@id': otherUserBranchId,
                    '@type': [`${CATALOG}UserBranch`],
                    [`${CATALOG}head`]: [{'@id': commitId}],
                    [`${CATALOG}createdFrom`]: [{'@id': createdFromId}],
                    [`${DCTERMS}title`]: [{'@value': branchTitle}],
                    [`${DCTERMS}description`]: [{'@value': branchDescription}]
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
                        describe('and when deleteRecordBranch is resolved', function() {
                            beforeEach(() => {
                                catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
                            });
                            it('and when deleteBranchState is resolved', fakeAsync(function() {
                                ontologyStateStub.deleteBranchState.and.returnValue(of(null));
                                ontologyStateStub.removeBranch.and.returnValue(of(null));
                                catalogManagerStub.updateRecordBranch.and.returnValue(of(null));
                                component.restoreBranchWithUserBranch();
                                tick();
                                expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                                expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: newBranchId});
                                expect(ontologyStateStub.deleteBranchState).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, userBranchId);
                                expect(ontologyStateStub.removeBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, userBranchId);
                                expect(catalogManagerStub.updateRecordBranch).toHaveBeenCalledWith(otherUserBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.otherUserBranch);
                            }));
                            it('and when deleteBranchState is rejected', fakeAsync(function() {
                                ontologyStateStub.deleteBranchState.and.returnValue(throwError(error));
                                component.restoreBranchWithUserBranch();
                                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                                tick();
                            }));
                        });
                        it('and when deleteOntologyBranch is rejected', fakeAsync(function() {
                            catalogManagerStub.deleteRecordBranch.and.returnValue(throwError(error));
                            component.restoreBranchWithUserBranch();
                            tick();
                            expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                        }));
                    });
                    it('and when updateState is rejected', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(throwError(error));
                        component.restoreBranchWithUserBranch();
                        tick();
                        expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: newBranchId});
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                    }));
                });
                it('and when getRecordBranch is rejected', fakeAsync(function() {
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                    component.restoreBranchWithUserBranch();
                    tick();
                    expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(newBranchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId);
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
            it('when createRecordBranch is rejected', fakeAsync(function() {
                catalogManagerStub.createRecordBranch.and.returnValue(throwError(error));
                component.restoreBranchWithUserBranch();
                tick();
                expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, this.branchConfig, ontologyStateStub.listItem.versionedRdfRecord.commitId);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        describe('mergeUserBranch calls the correct methods', function() {
            beforeEach(function() {
                this.target = { '@id': 'target' };
                this.source = { '@id': 'source', [`${CATALOG}createdFrom`]: [{ '@id': this.target['@id'] }] };
                ontologyStateStub.listItem.branches = [this.source, this.target];
                ontologyStateStub.listItem.versionedRdfRecord.branchId = this.source['@id'];
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
                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
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
                    expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Pulling changes failed');
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
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
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
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
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
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(component.index).toEqual(100);
            }));
        });
        it('getEntityName should call the correct method', function() {
            ontologyStateStub.getEntityNameByListItem.and.returnValue('iri');
            expect(component.getEntityName('id')).toEqual('iri');
            expect(ontologyStateStub.getEntityNameByListItem).toHaveBeenCalledWith('id');
        });
        describe('toggleFull sets the full resource on a changes item', function() {
            it('unless the full display should be removed', function() {
                const item = {id: obj['@id'], entityName: '', difference: new Difference(), disableAll: false, resource: obj, showFull: false, isBlankNode: false};
                component.toggleFull(item);
                expect(catalogManagerStub.getCompiledResource).not.toHaveBeenCalled();
                expect(item.resource).toBeUndefined();
            });
            it('successfully', fakeAsync(function() {
                catalogManagerStub.getCompiledResource.and.returnValue(of([{'@id': 'other'}, obj]));
                const item = {id: obj['@id'], entityName: '', difference: new Difference(), disableAll: false, resource: undefined, showFull: true, isBlankNode: false};
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.commitId, obj['@id']);
                expect(item.resource).toEqual(obj);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getCompiledResource.and.returnValue(throwError('Error Message'));
                const item = {id: obj['@id'], entityName: '', difference: new Difference(), disableAll: false, resource: undefined, showFull: true, isBlankNode: false};
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.commitId, obj['@id']);
                expect(item.resource).toBeUndefined();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
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
