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
import { Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { get } from 'lodash';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CreateBranchModal } from '../createBranchModal/createBranchModal.component';
import { CreateTagModal } from '../createTagModal/createTagModal.component';
import { DownloadRecordModalComponent } from '../downloadRecordModal/downloadRecordModal.component';
import { UploadRecordModalComponent } from '../uploadRecordModal/uploadRecordModal.component';
import { CommitModalComponent } from '../commitModal/commitModal.component';

import './editorTopBar.component.scss';

/**
 * @class shapes-graph-editor.EditorTopBarComponent
 *
 * `edit-top-bar` is a component that provides the top navigation bar for ShapesGraphRecords.
 */
@Component({
    selector: 'editor-top-bar',
    templateUrl: './editorTopBar.component.html'
})
export class EditorTopBarComponent {

    constructor(private dialog: MatDialog, public state: ShapesGraphStateService,
                @Inject('catalogManagerService') private cm, @Inject('utilService') private util) {}

    createBranch(): void {
        this.dialog.open(CreateBranchModal, {});
    }

    createTag(): void {
        this.dialog.open(CreateTagModal, {});
    }

    download(): void {
        this.dialog.open(DownloadRecordModalComponent, {
            data: {
                recordId: this.state.listItem.versionedRdfRecord.recordId,
                branchId: this.state.listItem.versionedRdfRecord.branchId,
                commitId: this.state.listItem.versionedRdfRecord.commitId,
                title: this.state.listItem.versionedRdfRecord.title
            }
        });
    }

    upload(): void {
        this.dialog.open(UploadRecordModalComponent, {});
    }

    commit(): void {
        this.dialog.open(CommitModalComponent, {});
    }

    toggleChanges(): void {
        this.state.listItem.changesPageOpen = !this.state.listItem.changesPageOpen;
    }

    downloadDisabled(): boolean {
        return !this.state?.listItem?.versionedRdfRecord?.recordId;
    }

    update(): Promise<void> {
        return this.cm.getBranchHeadCommit(this.state.listItem.versionedRdfRecord.branchId, this.state.listItem.versionedRdfRecord.recordId, get(this.cm.localCatalog, '@id', ''))
            .then(headCommit => {
                const commitId = get(headCommit, 'commit[\'@id\']', '');
                return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, this.state.listItem.versionedRdfRecord.branchId, commitId, undefined, this.state.listItem.versionedRdfRecord.title);
            }, error => Promise.reject(error))
            .then(() => this.util.createSuccessToast('Shapes Graph branch has been updated.'), error => this.util.createErrorToast(error));
    }
}
