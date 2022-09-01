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
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.UploadChangesOverlayComponent
 *
 * A component that creates content for a modal that uploads an RDF file of an updated version of the current
 * {@link shared.OntologyStateService#listItem selected ontology} to be compared and the differences added to the
 * InProgressCommit. The form in the modal contains a {@link shared.FileInputComponent} that accepts an RDF file. Meant
 * to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'upload-changes-overlay',
    templateUrl: './uploadChangesOverlay.component.html'
})
export class UploadChangesOverlayComponent {
    error: RESTError;
    file = undefined;

    constructor(public os: OntologyStateService, private dialogRef: MatDialogRef<UploadChangesOverlayComponent>,) {}

    submit(): void {
        if (this.os.hasInProgressCommit()) {
            this.error = {
                error: '',
                errorDetails: [],
                errorMessage: 'Unable to upload changes. Please either commit your current changes or discard them and try again.'
            };
        } else {
            const ontRecord = this.os.listItem.versionedRdfRecord;
            this.os.uploadChanges(this.file, ontRecord.recordId, ontRecord.branchId, ontRecord.commitId).subscribe(() => {
                this.os.listItem.tabIndex = OntologyListItem.SAVED_CHANGES_TAB;
                this.dialogRef.close();
            }, errorMessage => this.error = errorMessage);
        }
    }
}