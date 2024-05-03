/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { find } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
  cleanStylesFromDOM, MockVersionedRdfState,
} from '../../../../test/ts/Shared';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../injection-token';
import { State } from '../../../shared/models/state.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { EditBranchModalComponent } from '../edit-branch-modal/edit-branch-modal.component';
import { EditorBranchSelectComponent, OptionGroup, Option } from './editor-branch-select.component';

describe('Editor Branch Select component', function() {
  let component: EditorBranchSelectComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<EditorBranchSelectComponent<VersionedRdfListItem>>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const branch1Rdf: JSONLDObject = {
    '@id': 'urn:branch1',
    '@type': [],
    [`${CATALOG}head`]: [{'@id': 'urn:branch1Commit'}],
    [`${DCTERMS}title`]: [{'@value': 'Branch with a description'}],
    [`${DCTERMS}description`]: [{'@value': 'This is a description'}]
  };
  const branch2Rdf: JSONLDObject = {
    '@id': 'urn:branch2',
    '@type': [],
    [`${CATALOG}head`]: [{'@id': 'urn:branch2Commit'}],
    [`${DCTERMS}title`]: [{'@value': 'Totally new branch'}]
  };
  const tag1Rdf: JSONLDObject = {
    '@id': 'urn:tag1',
    '@type': [],
    [`${CATALOG}commit`]: [{'@id': 'urn:branch2Commit'}],
    [`${DCTERMS}title`]: [{'@value': 'Totally Cool Tag'}]
  };

  const branch1: Option = {
    branchIri: branch1Rdf['@id'],
    commitIri: 'urn:branch1Commit',
    title: 'Branch with a description',
    description: 'This is a description',
    jsonld: branch1Rdf
  };
  const branch2: Option = {
    branchIri: branch2Rdf['@id'],
    commitIri: 'urn:branch2Commit',
    title: 'Totally new branch',
    description: '',
    jsonld: branch2Rdf
  };
  const tag1: Option = {
    tagIri: tag1Rdf['@id'],
    commitIri: 'urn:branch2Commit',
    title: 'Totally Cool Tag',
    description: '',
    jsonld: tag1Rdf
  };
  const commit1: Option = {
    tagIri: '',
    commitIri: 'http://test.com#1234567890',
    title: 'Commit',
    description: ''
  };
  const branchEvent = {
    option: {
      value: branch1
    }
  } as MatAutocompleteSelectedEvent;
  const tagEvent = {
    option: {
      value: tag1
    }
  } as MatAutocompleteSelectedEvent;
  const state: State = {
    id: 'state',
    model: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatAutocompleteModule
      ],
      declarations: [
        EditorBranchSelectComponent,
        MockComponent(ConfirmModalComponent),
        MockComponent(EditBranchModalComponent)
      ],
      providers: [
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
        MockProvider(ToastService),
        MockProvider(CatalogManagerService),
        MockProvider(ProgressSpinnerService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
          open: { afterClosed: () => of(true)}
        }) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorBranchSelectComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.listItem = new VersionedRdfListItem();
    stateStub.listItem.currentVersionTitle = '';
    stateStub.getStateByRecordId.and.returnValue(state);
    stateStub.validateCurrentStateExists.and.returnValue(of(null));

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
    catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: [branch1Rdf, branch2Rdf]})));
    catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse({body: [tag1Rdf]})));
    catalogManagerStub.getRecordBranch.and.returnValue(of({
      '@id': branch1.branchIri,
      '@type': [],
      [`${CATALOG}head`]: [{'@id': branch1.commitIri}]
    }));
    catalogManagerStub.getCommit.and.returnValue(of({
      '@id': tag1.commitIri,
      '@type': []
    }));

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    component.recordIri = 'recordId';
    component.branchTitle = 'MASTER';
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialog = null;
    stateStub = null;
    catalogManagerStub = null;
  });

  describe('should initialize with the correct data for', function() {
    it('recordIri', function() {
      expect(component.recordIri).toEqual('recordId');
    });
    it('branchTitle', function() {
      expect(component.branchTitle).toEqual('MASTER');
    });
  });
  describe('controller methods', function() {
    it('should initialize by calling the correct methods', function() {
      spyOn<any>(component, '_setFilteredOptions');
      spyOn<any>(component, '_updateDisabled');
      component.ngOnInit();

      expect(component['_setFilteredOptions']).toHaveBeenCalledWith();
      expect(component['_updateDisabled']).toHaveBeenCalledWith(component.recordIri);
    });
    describe('should enable and reset the search', function() {
      describe('if the record has changed', function() {
        it('and it is not the first change', function() {
          spyOn(component.branchSearchControl, 'enable');
          spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
          component.ngOnChanges({
            recordIri: {
              currentValue: 'newRecordId',
              previousValue: 'recordId',
              firstChange: false,
              isFirstChange(): boolean {
                return false;
              }
            }
          });
          expect(component.retrieveBranchesAndTags).toHaveBeenCalledWith();
          expect(component.branchSearchControl.enable).toHaveBeenCalledWith();
        });
        it('unless it is the first change', function() {
          spyOn(component.branchSearchControl, 'enable');
          spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
          component.ngOnChanges({
            recordIri: {
              currentValue: 'newRecordId',
              previousValue: 'recordId',
              firstChange: true,
              isFirstChange(): boolean {
                return true;
              }
            }
          });
          expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
          expect(component.branchSearchControl.enable).not.toHaveBeenCalled();
        });
        it('and the recordIri is empty', function() {
          spyOn(component.branchSearchControl, 'enable');
          spyOn(component.branchSearchControl, 'disable');
          spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
          spyOn(component, 'resetSearch');
          component.ngOnChanges({
            recordIri: {
              currentValue: '',
              previousValue: 'recordId',
              firstChange: false,
              isFirstChange(): boolean {
                return false;
              }
            }
          });
          expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
          expect(component.branchSearchControl.enable).not.toHaveBeenCalled();
          expect(component.branchSearchControl.disable).toHaveBeenCalledWith();
          expect(component.resetSearch).toHaveBeenCalledWith();
        });
      });
      describe('when the branch title has changed', function() {
        it('for the first time', function() {
          spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
          spyOn(component, 'resetSearch');
          component.ngOnChanges({
            branchTitle: {
              currentValue: 'branch',
              previousValue: undefined,
              firstChange: false,
              isFirstChange(): boolean {
                return false;
              }
            }
          });
          expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
          expect(component.resetSearch).toHaveBeenCalledWith();
        });
        it('not for the first time', function() {
          spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
          spyOn(component, 'resetSearch');
          component.ngOnChanges({
            branchTitle: {
              currentValue: 'branch',
              previousValue: 'MASTER',
              firstChange: false,
              isFirstChange(): boolean {
                return false;
              }
            }
          });
          expect(component.retrieveBranchesAndTags).toHaveBeenCalledWith();
          expect(component.resetSearch).toHaveBeenCalledWith();
        });
      });
    });
    it('should filter branches based on provided text', async function() {
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      let result: OptionGroup[] = component.filter('');
      let branches: OptionGroup = find(result, {title: 'Branches'});
      let tags: OptionGroup = find(result, {title: 'Tags'});

      expect(branches.options.length).toEqual(2);
      expect(branches.options[0]).toEqual(branch1);
      expect(branches.options[1]).toEqual(branch2);
      expect(tags.options.length).toEqual(1);
      expect(tags.options[0]).toEqual(tag1);

      result = component.filter('cool');
      branches = find(result, {title: 'Branches'});
      tags = find(result, {title: 'Tags'});

      expect(branches).toBeUndefined();
      expect(tags.options.length).toEqual(1);
      expect(tags.options[0]).toEqual(tag1);
    });
    describe('should select the version', function() {
      beforeEach(function() {
        stateStub.isCommittable.and.returnValue(false);
        stateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        stateStub.changeVersion.and.returnValue(of(null));
        spyOn(component, 'resetSearch');
      });
      it('unless there is an in progress commit', function() {
        stateStub.isCommittable.and.returnValue(true);
        component.selectVersion(branchEvent);
        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(component.resetSearch).toHaveBeenCalledWith();
      });
      describe('for a branch and update state', function() {
        describe('successfully', function() {
          it('and the listItem is up to date', fakeAsync(function() {
            stateStub.getCommitIdOfBranchState.and.returnValue(branch1.commitIri);
            component.selectVersion(branchEvent);
            tick();
            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
            expect(stateStub.getStateByRecordId).toHaveBeenCalledWith('recordId');
            expect(stateStub.getCommitIdOfBranchState).toHaveBeenCalledWith(state, branch1.branchIri);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('recordId', branch1.branchIri, branch1.commitIri, undefined, branch1.title, true, false, false);
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalledWith();
          }));
          it('and the listItem is not up to date', fakeAsync(function() {
            stateStub.getCommitIdOfBranchState.and.returnValue('otherCommit');
            component.selectVersion(branchEvent);
            tick();
            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
            expect(stateStub.getStateByRecordId).toHaveBeenCalledWith('recordId');
            expect(stateStub.getCommitIdOfBranchState).toHaveBeenCalledWith(state, branch1.branchIri);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('recordId', branch1.branchIri, 'otherCommit', undefined, branch1.title, false, false, false);
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalledWith();
          }));
        });
        describe('unless an error occurs', function() {
          it('when retrieving the branch', fakeAsync(function() {
            catalogManagerStub.getRecordBranch.and.returnValue(throwError('Error'));
            component.selectVersion(branchEvent);
            tick();
            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
            expect(stateStub.getStateByRecordId).not.toHaveBeenCalled();
            expect(stateStub.getCommitIdOfBranchState).not.toHaveBeenCalled();
            expect(stateStub.changeVersion).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            expect(component.resetSearch).not.toHaveBeenCalled();
          }));
          it('when updating the state', fakeAsync(function() {
            stateStub.changeVersion.and.returnValue(throwError('Error'));
            component.selectVersion(branchEvent);
            tick();
            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
            expect(stateStub.getStateByRecordId).toHaveBeenCalledWith('recordId');
            expect(stateStub.getCommitIdOfBranchState).toHaveBeenCalledWith(state, branch1.branchIri);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('recordId', branch1.branchIri, branch1.commitIri, undefined, branch1.title, true, false, false);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            expect(component.resetSearch).not.toHaveBeenCalled();
          }));
        });
      });
      describe('for a tag and update state', function() {
        it('successfully', fakeAsync(function() {
          component.selectVersion(tagEvent);
          tick();
          expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
          expect(stateStub.changeVersion).toHaveBeenCalledWith('recordId', undefined, tag1.commitIri, tag1.tagIri, tag1.title, true, false, false);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(component.resetSearch).toHaveBeenCalledWith();
        }));
        describe('unless an error occurs', function() {
          it('when retrieving the commit', fakeAsync(function() {
            catalogManagerStub.getCommit.and.returnValue(throwError('Error'));
            component.selectVersion(tagEvent);
            tick();
            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
            expect(stateStub.changeVersion).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            expect(component.resetSearch).not.toHaveBeenCalled();
          }));
          it('when updating the state', fakeAsync(function() {
            stateStub.changeVersion.and.returnValue(throwError('Error'));
            component.selectVersion(tagEvent);
            tick();
            expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('recordId', undefined, tag1.commitIri, tag1.tagIri, tag1.title, true, false, false);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            expect(component.resetSearch).not.toHaveBeenCalled();
          }));
        });
      });
    });
    it('should handle first opening the autocomplete', function() {
      spyOn(component, 'retrieveBranchesAndTags').and.returnValue(of(null));
      component.branchSearchControl.setValue('Test');
      component.branchSearchControl.markAsTouched();
      component.open();
      expect(component.retrieveBranchesAndTags).toHaveBeenCalledWith();
      expect(component.branchSearchControl.value).toEqual(null);
      expect(component.branchSearchControl.touched).toBeFalse();
    });
    describe('should reset the search', function() {
      beforeEach(async function() {
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
      });
      it('when no version title is set', function() {
        spyOn(component.branchSearchControl, 'setValue');
        component.resetSearch();
        expect(component.branchSearchControl.setValue).toHaveBeenCalledWith('', {emitEvent: false});
        expect(component.selectedIcon).toEqual({
          mat: true,
          icon: ''
        });
      });
      describe('when a version title is set', function() {
        it('and is a branch', function() {
          stateStub.listItem.currentVersionTitle = branch1.title;
          stateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
          spyOn(component.branchSearchControl, 'setValue');
          component.resetSearch();
          expect(component.branchSearchControl.setValue).toHaveBeenCalledWith(branch1.title, {emitEvent: false});
          expect(component.selectedIcon).toEqual({
            mat: false,
            icon: 'fa fa-code-fork fa-lg'
          });
        });
        it('and is a tag', function() {
          stateStub.listItem.currentVersionTitle = tag1.title;
          stateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
          stateStub.listItem.versionedRdfRecord.commitId = tag1.commitIri;
          spyOn(component.branchSearchControl, 'setValue');
          component.resetSearch();
          expect(component.branchSearchControl.setValue).toHaveBeenCalledWith(tag1.title, {emitEvent: false});
          expect(component.selectedIcon).toEqual({
            mat: true,
            icon: 'local_offer'
          });
        });
        it('and is a commit', function() {
          component.commits = [commit1];
          stateStub.listItem.currentVersionTitle = '1234567890';
          stateStub.listItem.versionedRdfRecord.tagId = '';
          stateStub.listItem.versionedRdfRecord.commitId = commit1.commitIri;
          spyOn(component.branchSearchControl, 'setValue');
          component.resetSearch();
          expect(component.branchSearchControl.setValue).toHaveBeenCalledWith('1234567890', {emitEvent: false});
          expect(component.selectedIcon).toEqual({
            mat: true,
            icon: 'commit'
          });
        });
      });
    });
    describe('should retrieve the branches and tags', function() {
      beforeEach(() => {
        spyOn(component.receiveBranches, 'emit');
      });
      describe('when there are return values', function() {
        describe('and the current version', function() {
          describe('of a branch', function() {
            it('exists', fakeAsync(function() {
              spyOn<any>(component, '_resetToMaster').and.returnValue(of(null));
              spyOn(component, 'resetSearch');

              stateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
              expect(stateStub.listItem.currentVersionTitle).toEqual('');
              component.retrieveBranchesAndTags().subscribe(() => {}, 
                () => fail('Observable should have succeeded'));
              tick();

              expect(component.branches).toEqual([branch1, branch2]);
              expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
              expect(component.tags).toEqual([tag1]);
              expect(stateStub.listItem.currentVersionTitle).toEqual(branch1.title);
              expect(component['_resetToMaster']).not.toHaveBeenCalled();
              expect(component.resetSearch).not.toHaveBeenCalled();
            }));
            describe('does not exists and it resets to master', function() {
              beforeEach(function() {
                stateStub.listItem.versionedRdfRecord.branchId = 'urn:doesntExist';
                stateStub.listItem.currentVersionTitle = 'Not Exists';
              });
              it('successfully', fakeAsync(function() {
                stateStub.deleteState.and.returnValue(of(null));
                stateStub.open.and.returnValue(of(null));
                spyOn(component.autocompleteTrigger, 'closePanel');
                component.retrieveBranchesAndTags().subscribe(() => {}, 
                  () => fail('Observable should have succeeded'));
                tick();

                expect(component.branches).toEqual([branch1, branch2]);
                expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                expect(component.tags).toEqual([tag1]);
                expect(stateStub.listItem.currentVersionTitle).toEqual('MASTER');
                expect(toastStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
              }));
              describe('unless an error occurs', function() {
                it('when deleting state', fakeAsync(function() {
                  stateStub.deleteState.and.returnValue(throwError('Error'));
                  spyOn(component.autocompleteTrigger, 'closePanel');
                  component.retrieveBranchesAndTags().subscribe(() => {}, 
                    () => fail('Observable should have succeeded'));
                  tick();

                  expect(component.branches).toEqual([branch1, branch2]);
                  expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                  expect(component.tags).toEqual([tag1]);
                  expect(stateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                  expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                  expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                }));
                it('when opening a record', fakeAsync(function() {
                  stateStub.deleteState.and.returnValue(of(null));
                  stateStub.open.and.returnValue(throwError('Error'));
                  spyOn(component.autocompleteTrigger, 'closePanel');
                  component.retrieveBranchesAndTags().subscribe(() => {}, 
                    () => fail('Observable should have succeeded'));
                  tick();

                  expect(component.branches).toEqual([branch1, branch2]);
                  expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                  expect(component.tags).toEqual([tag1]);
                  expect(stateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                  expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                  expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                }));
              });
            });
          });
          describe('of a tag', function() {
            it('exists', fakeAsync(function() {
              spyOn<any>(component, '_resetToMaster').and.returnValue(of(null));
              spyOn(component, 'resetSearch');

              stateStub.listItem.versionedRdfRecord.branchId = '';
              stateStub.listItem.versionedRdfRecord.commitId = tag1.commitIri;
              stateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
              expect(stateStub.listItem.currentVersionTitle).toEqual('');
              component.retrieveBranchesAndTags().subscribe(() => {}, 
                () => fail('Observable should have succeeded'));
              tick();

              expect(component.branches).toEqual([branch1, branch2]);
              expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
              expect(component.tags).toEqual([tag1]);
              expect(stateStub.listItem.currentVersionTitle).toEqual(tag1.title);
              expect(component['_resetToMaster']).not.toHaveBeenCalled();
              expect(component.resetSearch).not.toHaveBeenCalled();
            }));
            describe('does not exists and it resets to master', function() {
              beforeEach(function() {
                stateStub.listItem.versionedRdfRecord.branchId = '';
                stateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
                stateStub.listItem.versionedRdfRecord.commitId = 'urn:doesntExist';
                stateStub.listItem.currentVersionTitle = 'Not Exists';
              });
              it('successfully', fakeAsync(function() {
                stateStub.deleteState.and.returnValue(of(null));
                stateStub.open.and.returnValue(of(null));
                spyOn(component.autocompleteTrigger, 'closePanel');
                component.retrieveBranchesAndTags().subscribe(() => {}, 
                  () => fail('Observable should have succeeded'));
                tick();

                expect(component.branches).toEqual([branch1, branch2]);
                expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                expect(component.tags).toEqual([tag1]);
                expect(stateStub.listItem.currentVersionTitle).toEqual('MASTER');
                expect(toastStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
              }));
              describe('unless an error occurs', function() {
                it('when deleting state', fakeAsync(function() {
                  stateStub.deleteState.and.returnValue(throwError('Error'));
                  spyOn(component.autocompleteTrigger, 'closePanel');
                  component.retrieveBranchesAndTags().subscribe(() => {}, 
                    () => fail('Observable should have succeeded'));
                  tick();

                  expect(component.branches).toEqual([branch1, branch2]);
                  expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                  expect(component.tags).toEqual([tag1]);
                  expect(stateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                  expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                  expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                }));
                it('when opening a record', fakeAsync(function() {
                  stateStub.deleteState.and.returnValue(of(null));
                  stateStub.open.and.returnValue(throwError('Error'));
                  spyOn(component.autocompleteTrigger, 'closePanel');
                  component.retrieveBranchesAndTags().subscribe(() => {}, 
                    () => fail('Observable should have succeeded'));
                  tick();

                  expect(component.branches).toEqual([branch1, branch2]);
                  expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
                  expect(component.tags).toEqual([tag1]);
                  expect(stateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                  expect(toastStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                  expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                  expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
                }));
              });
            });
          });
          it('of a commit', fakeAsync(function() {
            component.commits = [commit1];
            spyOn<any>(component, '_resetToMaster').and.returnValue(of(null));
            spyOn(component, 'resetSearch');

            stateStub.listItem.versionedRdfRecord.branchId = '';
            stateStub.listItem.versionedRdfRecord.commitId = commit1.commitIri;
            stateStub.listItem.versionedRdfRecord.tagId = '';
            expect(stateStub.listItem.currentVersionTitle).toEqual('');
            component.retrieveBranchesAndTags().subscribe(() => {}, 
              () => fail('Observable should have succeeded'));
            tick();

            expect(component.branches).toEqual([branch1, branch2]);
            expect(component.receiveBranches.emit).toHaveBeenCalledWith([branch1Rdf, branch2Rdf]);
            expect(component.tags).toEqual([tag1]);
            expect(stateStub.listItem.currentVersionTitle).toEqual('1234567890');
            expect(component['_resetToMaster']).not.toHaveBeenCalled();
            expect(component.resetSearch).not.toHaveBeenCalled();
          }));
        });
      });
      it('unless there are no return values', fakeAsync(function() {
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: []})));
        catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse({body: []})));
        spyOn<any>(component, '_checkVersionDeleted');
        spyOn(component, 'resetSearch');
        component.retrieveBranchesAndTags().subscribe(() => {}, 
          () => fail('Observable should have succeeded'));
        tick();
        expect(component.receiveBranches.emit).toHaveBeenCalledWith([]);
        expect(component['_checkVersionDeleted']).not.toHaveBeenCalled();
        expect(component.resetSearch).not.toHaveBeenCalledWith();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless the branch promise fails', fakeAsync(function() {
        catalogManagerStub.getRecordBranches.and.returnValue(throwError('Error'));
        component.retrieveBranchesAndTags().subscribe(() => {}, 
          () => fail('Observable should have succeeded'));
        tick();
        expect(component.receiveBranches.emit).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
      }));
      it('unless the tag promise fails', fakeAsync(function() {
        catalogManagerStub.getRecordVersions.and.returnValue(throwError('Error'));
        component.retrieveBranchesAndTags().subscribe(() => {}, 
          () => fail('Observable should have succeeded'));
        tick();
        expect(component.receiveBranches.emit).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
      }));
    });
    describe('should open the edit branch modal and', function() {
      beforeEach(function() {
        spyOn(component, 'resetSearch');
      });
      it('update the current title if the current branch was edited', fakeAsync(function() {
        stateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
        component.showEditBranchOverlay(branch1, new Event('edit'));
        tick();
        expect(stateStub.listItem.currentVersionTitle).toEqual(branch1.title);
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
      it('do nothing if a different branch was edited than the current one', fakeAsync(function() {
        const title = stateStub.listItem.currentVersionTitle;
        component.showEditBranchOverlay(branch1, new Event('edit'));
        tick();
        expect(stateStub.listItem.currentVersionTitle).toEqual(title);
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
    });
    describe('should open the delete branch confirmation modal and process correctly when', function() {
      beforeEach(function() {
        spyOn<any>(component, '_resetToMaster').and.returnValue(of(null));
        spyOn(component, 'resetSearch');
        catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
      });
      it('the current state exists', fakeAsync(function() {
        spyOn(component.autocompleteTrigger, 'closePanel');
        component.showDeleteBranchConfirmationOverlay(branch1, new Event('delete'));
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
        expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', branch1.branchIri, 'catalog');
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(stateStub.validateCurrentStateExists).toHaveBeenCalledWith('recordId');
        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
        expect(component['_resetToMaster']).not.toHaveBeenCalled();
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
      it('the current state no longer exists', fakeAsync(function() {
        stateStub.validateCurrentStateExists.and.returnValue(throwError('Error'));
        spyOn(component.autocompleteTrigger, 'closePanel');
        component.showDeleteBranchConfirmationOverlay(branch1, new Event('delete'));
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
        expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', branch1.branchIri, 'catalog');
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(stateStub.validateCurrentStateExists).toHaveBeenCalledWith('recordId');
        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(component['_resetToMaster']).toHaveBeenCalledWith();
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
    });
    describe('should open the delete tag confirmation modal and process correctly when', function() {
      beforeEach(function() {
        spyOn<any>(component, '_resetToMaster').and.returnValue(of(null));
        spyOn(component, 'resetSearch');
        catalogManagerStub.deleteRecordVersion.and.returnValue(of(null));
      });
      it('when the current state still exists', fakeAsync(function() {
        spyOn(component.autocompleteTrigger, 'closePanel');
        component.showDeleteTagConfirmationOverlay(tag1, new Event('delete'));
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
        expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
        expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tag1.tagIri, 'recordId', 'catalog');
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(stateStub.validateCurrentStateExists).toHaveBeenCalledWith('recordId');
        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
        expect(component['_resetToMaster']).not.toHaveBeenCalled();
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
      it('when the current state no longer exists', fakeAsync(function() {
        stateStub.validateCurrentStateExists.and.returnValue(throwError('Error'));
        spyOn(component.autocompleteTrigger, 'closePanel');
        component.showDeleteTagConfirmationOverlay(tag1, new Event('delete'));
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
        expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
        expect(catalogManagerStub.deleteRecordVersion).toHaveBeenCalledWith(tag1.tagIri, 'recordId', 'catalog');
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(stateStub.validateCurrentStateExists).toHaveBeenCalledWith('recordId');
        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(component['_resetToMaster']).toHaveBeenCalledWith();
        expect(component.resetSearch).toHaveBeenCalledWith();
      }));
    });
    it('should return the display text for the input', function() {
      expect(component.displayWith('text')).toEqual('text');
      expect(component.displayWith(branch1)).toEqual(branch1.title);
      expect(component.displayWith(undefined)).toEqual('');
    });
    describe('should determine whether an option is selected', function() {
      it('if it is a branch', function() {
        expect(component.isSelected(branch1)).toBeFalse();
        stateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
        expect(component.isSelected(branch1)).toBeTrue();
      });
      it('if it is a tag', function() {
        expect(component.isSelected(tag1)).toBeFalse();
        stateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
        expect(component.isSelected(tag1)).toBeTrue();
      });
      it('if it is a commit', function() {
        expect(component.isSelected(commit1)).toBeFalse();
        stateStub.listItem.versionedRdfRecord.commitId = commit1.commitIri;
        expect(component.isSelected(commit1)).toBeTrue();
      });
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('mat-form-field.editor-branch-select')).length).toEqual(1);
    });
    it('with an input for filtering', function() {
      const input = element.queryAll(By.css('input'));
      expect(input.length).toEqual(1);
    });
    describe('with a mat-autocomplete', function() {
      it('with groups for branches and tags', async function () {
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const labels = element.queryAll(By.css('.mat-optgroup-label'));
        expect(labels.length).toEqual(2);
        
        expect(labels[0].nativeElement.textContent.trim()).toEqual('Branches');
        expect(labels[1].nativeElement.textContent.trim()).toEqual('Tags');
      });
    });
  });
  it('should call showDeleteBranchConfirmationOverlay when the branch delete button is clicked', async function() {
    spyOn(component, 'showDeleteBranchConfirmationOverlay');
    stateStub.listItem.userCanModify = true;
    fixture.detectChanges();
    await fixture.whenStable();

    component.autocompleteTrigger.openPanel();
    fixture.detectChanges();
    await fixture.whenStable();

    const deleteButton = element.queryAll(By.css('button.delete-branch'))[0];
    deleteButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showDeleteBranchConfirmationOverlay).toHaveBeenCalledWith(jasmine.any(Object), null);
  });
  it('should call showDeleteTagConfirmationOverlay when the branch delete button is clicked', async function() {
    spyOn(component, 'showDeleteTagConfirmationOverlay');
    fixture.detectChanges();
    await fixture.whenStable();

    component.autocompleteTrigger.openPanel();
    fixture.detectChanges();
    await fixture.whenStable();

    const createButton = element.queryAll(By.css('button.delete-tag'))[0];
    createButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showDeleteTagConfirmationOverlay).toHaveBeenCalledWith(jasmine.any(Object), null);
  });
  it('should select a version when clicked', async function() {
    spyOn(component, 'selectVersion');
    fixture.detectChanges();
    await fixture.whenStable();

    component.autocompleteTrigger.openPanel();
    fixture.detectChanges();
    await fixture.whenStable();

    const option = element.queryAll(By.css('mat-option'))[1]; // Open branch
    option.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectVersion).toHaveBeenCalledWith(jasmine.any(Object));
  });
});
