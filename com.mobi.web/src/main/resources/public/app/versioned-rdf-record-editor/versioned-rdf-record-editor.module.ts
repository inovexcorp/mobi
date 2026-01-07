/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

import { ChangesPageComponent } from './components/changes-page/changes-page.component';
import { CommitModalComponent } from './components/commit-modal/commit-modal.component';
import { CreateBranchModalComponent } from './components/create-branch-modal/create-branch-modal.component';
import { CreateTagModalComponent } from './components/create-tag-modal/create-tag-modal.component';
import { DownloadRecordModalComponent } from './components/download-record-modal/download-record-modal.component';
import { EditBranchModalComponent } from './components/edit-branch-modal/edit-branch-modal.component';
import { EditorTopBarComponent } from './components/editor-top-bar/editor-top-bar.component';
import { EditorRecordSelectComponent } from './components/editor-record-select/editor-record-select.component';
import { EditorBranchSelectComponent } from './components/editor-branch-select/editor-branch-select.component';
import { MergePageComponent } from './components/merge-page/merge-page.component';
import { NewRecordModalComponent } from './components/new-record-modal/new-record-modal.component';
import { UploadChangesModalComponent } from './components/upload-changes-modal/upload-changes-modal.component';
import { UploadErrorsModalComponent } from './components/upload-errors-modal/upload-errors-modal.component';
import { UploadRecordLogComponent } from './components/upload-record-log/upload-record-log.component';
import { UploadRecordModalComponent } from './components/upload-record-modal/upload-record-modal.component';

@NgModule({
  declarations: [
    ChangesPageComponent,
    CommitModalComponent,
    CreateBranchModalComponent,
    CreateTagModalComponent,
    DownloadRecordModalComponent,
    EditBranchModalComponent,
    EditorBranchSelectComponent,
    EditorRecordSelectComponent,
    EditorTopBarComponent,
    MergePageComponent,
    NewRecordModalComponent,
    UploadChangesModalComponent,
    UploadErrorsModalComponent,
    UploadRecordModalComponent,
    UploadRecordLogComponent
  ],
  exports: [
    ChangesPageComponent,
    CommitModalComponent,
    CreateBranchModalComponent,
    CreateTagModalComponent,
    DownloadRecordModalComponent,
    EditBranchModalComponent,
    EditorBranchSelectComponent,
    EditorRecordSelectComponent,
    EditorTopBarComponent,
    MergePageComponent,
    NewRecordModalComponent,
    UploadChangesModalComponent,
    UploadErrorsModalComponent,
    UploadRecordModalComponent,
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class VersionedRdfRecordEditorModule { }
