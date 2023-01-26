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
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { UtilService } from '../../../shared/services/util.service';

import './uploadDataOverlay.component.scss';

/**
 * @class datasets.UploadDataOverlayComponent
 *
 * A component that creates content for a modal with a form to select an RDF file to import into the
 * {@link shared.DatasetStateService selected dataset}. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'upload-data-overlay',
    templateUrl: './uploadDataOverlay.component.html'
})
export class UploadDataOverlayComponent implements OnInit {
    error = '';
    fileObj: File = undefined;
    datasetTitle = '';
    importing = false;

    constructor(private dialogRef: MatDialogRef<UploadDataOverlayComponent>, public dm: DatasetManagerService,
        public state: DatasetStateService, public util: UtilService) {}
    
    ngOnInit(): void {
        this.datasetTitle = this.util.getDctermsValue(this.state.selectedDataset.record, 'title');
    }
    submit(): void {
        this.importing = true;
        this.dm.uploadData(this.state.selectedDataset.record['@id'], this.fileObj, true)
            .subscribe(() => {
                this.importing = false;
                this.util.createSuccessToast('Data successfully uploaded to ' + this.datasetTitle);
                this.dialogRef.close();
            }, error => this._onError(error));
    }

    private _onError(errorMessage: string) {
        this.importing = false;
        this.error = errorMessage;
    }
}
