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
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { OntologyRecordDisplay } from '../openOntologyTab/openOntologyTab.component';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

/**
 * @class ontology-editor.OntologyDownloadModalComponent
 * 
 * A component that creates content for a modal that downloaded the provided OntologyRecord into
 * a chosen RDF format from a {@link shared.SerializationSelectComponent}. The ontology is provided to the
 * modal in the form of a `OntologyRecordDisplay` from {@link ontology-editor.OpenOntologyTabComponent} Meant to be used
 * in conjunction with the `MatDialog` service.
 */
@Component({
  selector: 'app-ontology-download-modal',
  templateUrl: './ontology-download-modal.component.html'
})
export class OntologyDownloadModalComponent {

    downloadForm: UntypedFormGroup = this._fb.group({
        serialization: ['turtle', [Validators.required]]
    });

    constructor(private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<OntologyDownloadModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {record: OntologyRecordDisplay}, private _om: OntologyManagerService) { }

    download(): void {
        const fileName = this.data.record.title.replace(/[ &/\\#,+()$~%.'":*?<>{}]/g, '');
        this._om.downloadOntology(this.data.record.jsonld['@id'], '', '', this.downloadForm.controls.serialization.value, fileName, false);
        this._dialogRef.close();
    }
}
