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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { switchMap } from 'rxjs/operators';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { Difference } from '../../../shared/models/difference.class';

/**
 * @class ontology-editor.OntologyCloseOverlayComponent
 *
 * A component that creates content for a modal that will close the provided `listItem`. The modal provides buttons to
 * Cancel the modal, close without saving, or save and then close. Meant to be used in conjunction with the `MatDialog`
 * service.
 */
@Component({
    selector: 'ontology-close-overlay',
    templateUrl: './ontologyCloseOverlay.component.html',
    styleUrls: ['./ontologyCloseOverlay.component.scss']
})
export class OntologyCloseOverlayComponent {
    error = '';
    constructor(private dialogRef: MatDialogRef<OntologyCloseOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {listItem: OntologyListItem}, public os: OntologyStateService) {}

    saveThenClose(): void {
        const diff = new Difference();
        diff.additions = this.data.listItem.additions;
        diff.deletions = this.data.listItem.deletions;
        this.os.saveChanges(this.data.listItem.versionedRdfRecord.recordId, diff)
            .pipe(switchMap(() => this.os.afterSave(this.data.listItem)))
            .subscribe(() => this.closeModal(), errorMessage => this.error = errorMessage);
    }
    closeModal(): void {
        this.os.closeOntology(this.data.listItem.versionedRdfRecord.recordId);
        this.dialogRef.close();
    }
}
