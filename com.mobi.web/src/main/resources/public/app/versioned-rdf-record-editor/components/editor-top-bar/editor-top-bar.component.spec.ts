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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { EditorRecordSelectComponent } from '../editor-record-select/editor-record-select.component';
import { EditorBranchSelectComponent } from '../editor-branch-select/editor-branch-select.component';
import { CommitModalComponent } from '../commit-modal/commit-modal.component';
import { DownloadRecordModalComponent } from '../download-record-modal/download-record-modal.component';
import { CreateBranchModalComponent } from '../create-branch-modal/create-branch-modal.component';
import { CreateTagModalComponent } from '../create-tag-modal/create-tag-modal.component';
import { UploadChangesModalComponent } from '../upload-changes-modal/upload-changes-modal.component';
import { UploadRecordLogComponent } from '../upload-record-log/upload-record-log.component';
import { EditorTopBarComponent } from './editor-top-bar.component';

describe('Editor Top Bar component', () => {
  let component: EditorTopBarComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<EditorTopBarComponent<VersionedRdfListItem>>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const catalogId = 'catalog';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
        MatButtonToggleModule
      ],
      declarations: [
        EditorTopBarComponent,
        MockComponent(EditorRecordSelectComponent),
        MockComponent(EditorBranchSelectComponent),
        MockComponent(ErrorDisplayComponent),
        MockComponent(UploadRecordLogComponent)
      ],
      providers: [
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
        MockProvider(CatalogManagerService),
        MockProvider(ToastService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true)}
          })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorTopBarComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.listItem = new VersionedRdfListItem();
    stateStub.listItem.versionedRdfRecord = {
      recordId: 'record1',
      branchId: 'branch1',
      commitId: 'commit1',
      title: 'title'
    };
    stateStub.changeVersion.and.returnValue(of(null));
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': catalogId};
    const commitDifference = new CommitDifference();
    commitDifference.commit = {'@id': 'commit3'};
    catalogManagerStub.getBranchCommit.and.returnValue(of(commitDifference));
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialog = null;
    stateStub = null;
    catalogManagerStub = null;
    toastStub = null;
  });

  describe('controller methods', () => {
    it('should open the create branch modal', () => {
      component.createBranch();
      expect(matDialog.open).toHaveBeenCalledWith(CreateBranchModalComponent, { viewContainerRef: jasmine.anything() });
    });
    it('should open the create tag modal', () => {
     component.createTag();
     expect(matDialog.open).toHaveBeenCalledWith(CreateTagModalComponent, { viewContainerRef: jasmine.anything() });
   });
    it('should open the download modal', () => {
      component.download();
      expect(matDialog.open).toHaveBeenCalledWith(DownloadRecordModalComponent,
        {
          viewContainerRef: jasmine.anything(),
          data: {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
          }
        });
    });
    it('should open the upload modal', () => {
      component.upload();
      expect(matDialog.open).toHaveBeenCalledWith(UploadChangesModalComponent, { viewContainerRef: jasmine.anything() });
    });
    it('should open the commit modal', () => {
      component.commit();
      expect(matDialog.open).toHaveBeenCalledWith(CommitModalComponent, { viewContainerRef: jasmine.anything() });
    });
    describe('should update the branch with the head', () => {
      describe('when getBranchCommit returns', () => {
        describe('and changeVersion returns', () => {
          it('successfully', fakeAsync(() => {
            component.update();
            tick();
            expect(catalogManagerStub.getBranchCommit).toHaveBeenCalledWith('head', 'branch1', 'record1', catalogId);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('record1', 'branch1', 'commit3', undefined, 'title', true, false, false);
            expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.stringContaining('branch has been updated.'));
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          }));
          it('unless an error occurs', fakeAsync(() => {
            stateStub.changeVersion.and.returnValue(throwError('Error'));
            component.update();
            tick();
            expect(catalogManagerStub.getBranchCommit).toHaveBeenCalledWith('head', 'branch1', 'record1', catalogId);
            expect(stateStub.changeVersion).toHaveBeenCalledWith('record1', 'branch1', 'commit3', undefined, 'title', true, false, false);
            expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
          }));
        });
      });
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.getBranchCommit.and.returnValue(throwError('Error'));
        component.update();
        tick();
        expect(catalogManagerStub.getBranchCommit).toHaveBeenCalledWith('head', 'branch1', 'record1', catalogId);
        expect(stateStub.changeVersion).not.toHaveBeenCalled();
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
      }));
    });
    it('should update the cached list of branches', () => {
      component.updateBranches([{'@id': 'branch'}]);
      expect(component.branches).toEqual([{'@id': 'branch'}]);
    });
    it('should get the create branch tooltip', () => {
      stateStub.listItem = undefined;
      expect(component.getCreateBranchTooltip()).toEqual('Select a record to create a branch');
      stateStub.listItem = new VersionedRdfListItem();
      expect(component.getCreateBranchTooltip()).toEqual('Select a record to create a branch');
      stateStub.listItem.versionedRdfRecord.commitId = 'commitId';
      expect(component.getCreateBranchTooltip()).toEqual('You do not have permission to create a branch');
      stateStub.listItem.userCanModify = true;
      expect(component.getCreateBranchTooltip()).toEqual('Create Branch');
    });
    it('should get the merge tooltip', () => {
      stateStub.listItem = undefined;
      expect(component.getMergeTooltip()).toEqual('Select a record to merge branches');
      stateStub.listItem = new VersionedRdfListItem();
      expect(component.getMergeTooltip()).toEqual('Cannot merge when a branch is not checked out');
      stateStub.listItem.versionedRdfRecord.branchId = 'branchId';
      stateStub.isCommittable.and.returnValue(true);
      expect(component.getMergeTooltip()).toEqual('Cannot merge branches with uncommitted changes');
      stateStub.isCommittable.and.returnValue(false);
      expect(component.getMergeTooltip()).toEqual('You do not have permission to merge branches');
      stateStub.canModify.and.returnValue(true);
      expect(component.getMergeTooltip()).toEqual('Not enough branches to perform a merge');
      component.branches = [{'@id': 'master'}, {'@id': 'branch'}];
      expect(component.getMergeTooltip()).toEqual('Merge Branch');
    });
    it('should get the create tag tooltip', () => {
      stateStub.listItem = undefined;
      expect(component.getCreateTagTooltip()).toEqual('Select a record to create tags');
      stateStub.listItem = new VersionedRdfListItem();
      expect(component.getCreateTagTooltip()).toEqual('Select a record to create tags');
      stateStub.listItem.versionedRdfRecord.recordId = 'recordId';
      stateStub.isCommittable.and.returnValue(true);
      expect(component.getCreateTagTooltip()).toEqual('Cannot create tags with uncommitted changes');
      stateStub.isCommittable.and.returnValue(false);
      expect(component.getCreateTagTooltip()).toEqual('You do not have permission to create tags');
      stateStub.listItem.userCanModify = true;
      expect(component.getCreateTagTooltip()).toEqual('Create Tag');
    });
    it('should get the upload changes tooltip', () => {
      stateStub.listItem = undefined;
      expect(component.getUploadChangesTooltip()).toEqual('Select a record to upload changes');
      stateStub.listItem = new VersionedRdfListItem();
      expect(component.getUploadChangesTooltip()).toEqual('Select a record to upload changes');
      stateStub.listItem.versionedRdfRecord.recordId = 'recordId';
      expect(component.getUploadChangesTooltip()).toEqual('Cannot upload changes if a branch is not checked out');
      stateStub.listItem.versionedRdfRecord.branchId = 'branchId';
      stateStub.isCommittable.and.returnValue(true);
      expect(component.getUploadChangesTooltip()).toEqual('Cannot upload changes with uncommitted changes');
      stateStub.isCommittable.and.returnValue(false);
      expect(component.getUploadChangesTooltip()).toEqual('You do not have permission to upload changes');
      stateStub.canModify.and.returnValue(true);
      expect(component.getUploadChangesTooltip()).toEqual('Upload Changes');
    });
    it('should get the commit tooltip', () => {
      expect(component.getCommitTooltip()).toEqual('No changes to commit');
      stateStub.isCommittable.and.returnValue(true);
      expect(component.getCommitTooltip()).toEqual('You do not have permission to commit');
      stateStub.canModify.and.returnValue(true);
      expect(component.getCommitTooltip()).toEqual('');
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.editor-top-bar')).length).toEqual(1);
    });
    it('with an editor record select', () => {
      const recordSelect = element.queryAll(By.css('app-editor-record-select'));
      expect(recordSelect.length).toEqual(1);
    });
    it('with an editor branch select', () => {
      const recordSelect = element.queryAll(By.css('app-editor-branch-select'));
      expect(recordSelect.length).toEqual(1);
    });
    it('with button to create a branch', async () => {
      let branchButton = element.queryAll(By.css('button.create-branch'));
      expect(branchButton.length).toEqual(1);
      expect(branchButton[0].nativeElement.getAttribute('disabled')).toBeNull();

      stateStub.listItem = new VersionedRdfListItem();
      fixture.detectChanges();
      await fixture.whenStable();
      branchButton = element.queryAll(By.css('button.create-branch'));
      expect(branchButton.length).toEqual(1);
      expect(branchButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
    });
    it('with button to download', async () => {
      let downloadButton = element.queryAll(By.css('button.download-record'));
      expect(downloadButton.length).toEqual(1);
      expect(downloadButton[0].nativeElement.getAttribute('disabled')).toBeNull();

      stateStub.listItem = new VersionedRdfListItem();
      fixture.detectChanges();
      await fixture.whenStable();
      downloadButton = element.queryAll(By.css('button.download-record'));
      expect(downloadButton.length).toEqual(1);
      expect(downloadButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
    });
    it('with button to upload changes', async () => {
      let uploadButton = element.queryAll(By.css('button.upload-changes'));
      expect(uploadButton.length).toEqual(1);
      expect(uploadButton[0].nativeElement.getAttribute('disabled')).toBeNull();

      stateStub.listItem = new VersionedRdfListItem();
      fixture.detectChanges();
      await fixture.whenStable();
      uploadButton = element.queryAll(By.css('button.upload-changes'));
      expect(uploadButton.length).toEqual(1);
      expect(uploadButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
    });
    it('with a chip to indicate uncommitted changes', async () => {
      let chip = element.queryAll(By.css('mat-chip.uncommitted'));
      expect(chip.length).toEqual(0);

      stateStub.isCommittable.and.returnValue(true);
      fixture.detectChanges();
      await fixture.whenStable();
      chip = element.queryAll(By.css('mat-chip.uncommitted'));
      expect(chip.length).toEqual(1);
    });
    describe('with a warning and button to update with head', () => {
      it('when there is not an inProgressCommit', async () => {
        let errorDisplay = element.queryAll(By.css('error-display'));
        expect(errorDisplay.length).toEqual(0);

        let updateButton = element.queryAll(By.css('button.update'));
        expect(updateButton.length).toEqual(0);

        stateStub.listItem.upToDate = false;

        fixture.detectChanges();
        await fixture.whenStable();
        updateButton = element.queryAll(By.css('button.update'));
        expect(updateButton.length).toEqual(1);
        expect(updateButton[0].nativeElement.getAttribute('disabled')).toBeNull();

        errorDisplay = element.queryAll(By.css('error-display'));
        expect(errorDisplay.length).toEqual(1);
        expect(errorDisplay[0].nativeElement.innerHTML).toContain('Branch is behind HEAD. Update with HEAD to commit.');
      });
      it('when there is an inProgressCommit', async () => {
        let errorDisplay = element.queryAll(By.css('error-display'));
        expect(errorDisplay.length).toEqual(0);

        let updateButton = element.queryAll(By.css('button.update'));
        expect(updateButton.length).toEqual(0);

        stateStub.listItem.upToDate = false;
        stateStub.listItem.inProgressCommit.additions = [{'@id': 'thing', '@type': ['otherThing']}];

        fixture.detectChanges();
        await fixture.whenStable();
        updateButton = element.queryAll(By.css('button.update'));
        expect(updateButton.length).toEqual(0);

        errorDisplay = element.queryAll(By.css('error-display'));
        expect(errorDisplay.length).toEqual(1);
        expect(errorDisplay[0].nativeElement.innerHTML).toContain('Branch is behind HEAD. Remove changes');
      });
    });
    it('with button to view changes', async () => {
      let changesButton = element.queryAll(By.css('button.changes'));
      expect(changesButton.length).toEqual(1);
      expect(changesButton[0].nativeElement.getAttribute('disabled')).toBeNull();

      stateStub.listItem = new VersionedRdfListItem();
      fixture.detectChanges();
      await fixture.whenStable();
      changesButton = element.queryAll(By.css('button.upload-changes'));
      expect(changesButton.length).toEqual(1);
      expect(changesButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
    });
    it('with button to commit', async () => {
      let commitButton = element.queryAll(By.css('button.commit'));
      expect(commitButton.length).toEqual(1);
      expect(commitButton[0].nativeElement.getAttribute('disabled')).toBeNull();

      stateStub.isCommittable.and.returnValue(false);
      fixture.detectChanges();
      await fixture.whenStable();
      commitButton = element.queryAll(By.css('button.commit'));
      expect(commitButton.length).toEqual(1);
      expect(commitButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
    });
  });
  it('should call download when the download button is clicked', async () => {
    spyOn(component, 'download');
    fixture.detectChanges();
    await fixture.whenStable();

    const createButton = element.queryAll(By.css('button.download-record'))[0];
    createButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.download).toHaveBeenCalledWith();
  });
  it('should call update when the Update with HEAD button is clicked', async () => {
    spyOn(component, 'update');
    stateStub.listItem.upToDate = false;
    fixture.detectChanges();
    await fixture.whenStable();

    const createButton = element.queryAll(By.css('button.update'))[0];
    createButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.update).toHaveBeenCalledWith();
  });
});
