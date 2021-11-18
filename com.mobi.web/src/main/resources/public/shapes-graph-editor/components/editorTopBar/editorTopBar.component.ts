/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
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

    constructor(private dialog: MatDialog, private state: ShapesGraphStateService) {}

    download(): void {
        this.dialog.open(DownloadRecordModalComponent, {
            data: {
                // TODO: Add params for branch and commit
                recordId: this.state.currentShapesGraphRecordIri
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
        this.state.changesPageOpen = !this.state.changesPageOpen;
    }

    downloadDisabled(): boolean {
        return !this.state.currentShapesGraphRecordIri;
    }
}
