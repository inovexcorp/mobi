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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RdfDownload } from '../../../shared/models/rdfDownload.interface';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';

/**
 * @class shapes-graph-editor.DownloadRecordModalComponent
 * 
 * A component that creates content for a modal with fields specifying the download parameters for the Record
 */
@Component({
    selector: 'download-record-modal',
    templateUrl: './downloadRecordModal.component.html'
})
export class DownloadRecordModalComponent implements OnInit {
    downloadRecordForm = this.fb.group({
        selectedValue: ['turtle', Validators.required],
        fileName: ['shapesGraph', Validators.required]
    });
    rdfFormats: string[] = ['turtle', 'rdf/xml', 'jsonld'];

    constructor(private dialogRef: MatDialogRef<DownloadRecordModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
                private fb: FormBuilder, private sm: ShapesGraphManagerService) {}

    ngOnInit() {
        this.downloadRecordForm.controls.fileName.setValue(this.data.title);
    }
    download(): void {
        const downloadParams: RdfDownload = {
            recordId: this.data.recordId,
            branchId: this.data.branchId,
            commitId: this.data.commitId,
            rdfFormat: this.downloadRecordForm.controls.selectedValue.value,
            fileName: this.downloadRecordForm.controls.fileName.value,
            applyInProgressCommit: true
        };
        this.sm.downloadShapesGraph(downloadParams);
        this.dialogRef.close(true);
    }
}