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
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CreateBranchModal } from '../createBranchModal/createBranchModal.component';
import { DownloadRecordModalComponent } from '../downloadRecordModal/downloadRecordModal.component';
import { EditorBranchSelectComponent } from '../editorBranchSelect/editorBranchSelect.component';
import { EditorRecordSelectComponent } from '../editorRecordSelect/editorRecordSelect.component';
import { UploadRecordModalComponent } from '../uploadRecordModal/uploadRecordModal.component';
import { CommitModalComponent } from '../commitModal/commitModal.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { UtilService } from '../../../shared/services/util.service';
import { EditorTopBarComponent } from './editorTopBar.component';

describe('Editor Top Bar component', function() {
    let component: EditorTopBarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorTopBarComponent>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const catalogId = 'catalog';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
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
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
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
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        shapesGraphStateStub.changeShapesGraphVersion.and.resolveTo();
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId};
        const commitDifference = new CommitDifference();
        commitDifference.commit = {'@id': 'commit3'};
        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(commitDifference));
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialog = null;
        shapesGraphStateStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        it('should open the create branch modal', function() {
            component.createBranch();
            expect(matDialog.open).toHaveBeenCalledWith(CreateBranchModal, {});
        });
        it('should open the download modal', function() {
            component.download();
            expect(matDialog.open).toHaveBeenCalledWith(DownloadRecordModalComponent,
                {
                    data: {
                        recordId: 'record1',
                        branchId: 'branch1',
                        commitId: 'commit1',
                        title: 'title'
                    }
                });
        });
        it('should open the upload modal', function() {
            component.upload();
            expect(matDialog.open).toHaveBeenCalledWith(UploadRecordModalComponent, {});
        });
        it('should open the commit modal', function() {
            component.commit();
            expect(matDialog.open).toHaveBeenCalledWith(CommitModalComponent, {});
        });
        it('should check if the download button is disabled', function() {
            expect(component.downloadDisabled()).toBeFalse();
            shapesGraphStateStub.listItem = new ShapesGraphListItem();
            expect(component.downloadDisabled()).toBeTrue();
        });
        describe('should update the branch with the head', function() {
            describe('when getBranchHeadCommit returns', function() {
                describe('and changeShapesGraphVersion returns', function() {
                   it('successfully', fakeAsync(function() {
                       component.update();
                       tick();
                       expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith('branch1', 'record1', catalogId);
                       expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record1', 'branch1', 'commit3', undefined, 'title');
                       expect(utilStub.createSuccessToast).toHaveBeenCalledWith('Shapes Graph branch has been updated.');
                       expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                   }));
                   it('unless an error occurs', fakeAsync(function() {
                       shapesGraphStateStub.changeShapesGraphVersion.and.rejectWith('Error');
                       component.update();
                       tick();
                       expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith('branch1', 'record1', catalogId);
                       expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record1', 'branch1', 'commit3', undefined, 'title');
                       expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                       expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                   }));
                });
            });
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getBranchHeadCommit.and.returnValue(throwError('Error'));
                component.update();
                tick();
                expect(catalogManagerStub.getBranchHeadCommit).toHaveBeenCalledWith('branch1', 'record1', catalogId);
                expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.editor-top-bar')).length).toEqual(1);
        });
        it('with an editor record select', function() {
            const recordSelect = element.queryAll(By.css('editor-record-select'));
            expect(recordSelect.length).toEqual(1);
        });
        it('with an editor branch select', function() {
            const recordSelect = element.queryAll(By.css('editor-branch-select'));
            expect(recordSelect.length).toEqual(1);
        });
        it('with button to create a branch', async function() {
            let branchButton = element.queryAll(By.css('button.create-branch'));
            expect(branchButton.length).toEqual(1);
            expect(branchButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.listItem = new ShapesGraphListItem();
            fixture.detectChanges();
            await fixture.whenStable();
            branchButton = element.queryAll(By.css('button.create-branch'));
            expect(branchButton.length).toEqual(1);
            expect(branchButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
        });
        it('with button to download', async function() {
            let downloadButton = element.queryAll(By.css('button.download-record'));
            expect(downloadButton.length).toEqual(1);
            expect(downloadButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.listItem = new ShapesGraphListItem();
            fixture.detectChanges();
            await fixture.whenStable();
            downloadButton = element.queryAll(By.css('button.download-record'));
            expect(downloadButton.length).toEqual(1);
            expect(downloadButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
        });
        it('with button to upload changes', async function() {
            let uploadButton = element.queryAll(By.css('button.upload-changes'));
            expect(uploadButton.length).toEqual(1);
            expect(uploadButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.listItem = new ShapesGraphListItem();
            fixture.detectChanges();
            await fixture.whenStable();
            uploadButton = element.queryAll(By.css('button.upload-changes'));
            expect(uploadButton.length).toEqual(1);
            expect(uploadButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
        });
        it('with a chip to indicate uncommitted changes', async function() {
            let chip = element.queryAll(By.css('mat-chip.uncommitted'));
            expect(chip.length).toEqual(0);

            shapesGraphStateStub.isCommittable.and.returnValue(true);
            fixture.detectChanges();
            await fixture.whenStable();
            chip = element.queryAll(By.css('mat-chip.uncommitted'));
            expect(chip.length).toEqual(1);
        });
        describe('with a warning and button to update with head', function() {
            it('when there is not an inProgressCommit', async function() {
                let errorDisplay = element.queryAll(By.css('error-display'));
                expect(errorDisplay.length).toEqual(0);

                let updateButton = element.queryAll(By.css('button.update'));
                expect(updateButton.length).toEqual(0);

                shapesGraphStateStub.listItem.upToDate = false;

                fixture.detectChanges();
                await fixture.whenStable();
                updateButton = element.queryAll(By.css('button.update'));
                expect(updateButton.length).toEqual(1);
                expect(updateButton[0].nativeElement.getAttribute('disabled')).toBeNull();

                errorDisplay = element.queryAll(By.css('error-display'));
                expect(errorDisplay.length).toEqual(1);
                expect(errorDisplay[0].nativeElement.innerHTML).toContain('Branch is behind HEAD. Update with HEAD to commit.');
            });
            it('when there is an inProgressCommit', async function() {
                let errorDisplay = element.queryAll(By.css('error-display'));
                expect(errorDisplay.length).toEqual(0);

                let updateButton = element.queryAll(By.css('button.update'));
                expect(updateButton.length).toEqual(0);

                shapesGraphStateStub.listItem.upToDate = false;
                shapesGraphStateStub.listItem.inProgressCommit.additions = [{'@id': 'thing', '@type': ['otherThing']}];

                fixture.detectChanges();
                await fixture.whenStable();
                updateButton = element.queryAll(By.css('button.update'));
                expect(updateButton.length).toEqual(0);

                errorDisplay = element.queryAll(By.css('error-display'));
                expect(errorDisplay.length).toEqual(1);
                expect(errorDisplay[0].nativeElement.innerHTML).toContain('Branch is behind HEAD. Remove changes to continue.');
            });
        });
        it('with button to view changes', async function() {
            let changesButton = element.queryAll(By.css('button.changes'));
            expect(changesButton.length).toEqual(1);
            expect(changesButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.listItem = new ShapesGraphListItem();
            fixture.detectChanges();
            await fixture.whenStable();
            changesButton = element.queryAll(By.css('button.upload-changes'));
            expect(changesButton.length).toEqual(1);
            expect(changesButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
        });
        it('with button to commit', async function() {
            let commitButton = element.queryAll(By.css('button.commit'));
            expect(commitButton.length).toEqual(1);
            expect(commitButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.isCommittable.and.returnValue(false);
            fixture.detectChanges();
            await fixture.whenStable();
            commitButton = element.queryAll(By.css('button.commit'));
            expect(commitButton.length).toEqual(1);
            expect(commitButton[0].nativeElement.getAttribute('disabled')).toEqual('true');
        });
    });
    it('should call download when the download button is clicked', async function() {
        spyOn(component, 'download');
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.download-record'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.download).toHaveBeenCalledWith();
    });
    it('should call update when the Update with HEAD button is clicked', async function() {
        spyOn(component, 'update');
        shapesGraphStateStub.listItem.upToDate = false;
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.update'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.update).toHaveBeenCalledWith();
    });
});
