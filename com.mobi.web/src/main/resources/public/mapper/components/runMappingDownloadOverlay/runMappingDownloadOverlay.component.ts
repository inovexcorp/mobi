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

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';

/**
 * @class mapper.component:runMappingDownloadOverlay
 *
 * A component that creates content for a modal that contains a configuration settings for running the currently selected
 * {@link shared.MapperStateService#selected mapping} against the uploaded
 * {@link shared.DelimitedManagerService#dataRows} and downloading the results. This includes a input for the file name
 * of the downloaded mapped data and a {@link mapper.MapperSerializationSelect} for the RDF format of the mapped data.
 * Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'run-mapping-download-overlay',
    templateUrl: './runMappingDownloadOverlay.component.html'
})
export class RunMappingDownloadOverlayComponent implements OnInit {
    errorMessage = '';
    runMappingDownloadForm = this.fb.group({
        fileName: ['', Validators.required],
        serialization: ['turtle', Validators.required]
    });

    constructor(private dialogRef: MatDialogRef<RunMappingDownloadOverlayComponent>, private fb: FormBuilder,
        private state: MapperStateService, private dm: DelimitedManagerService,
        private camelCasePipe: CamelCasePipe, @Inject('utilService') private util) {}

    ngOnInit(): void {
        const title = this.state.selected.record ? this.state.selected.record.title : this.state.selected.config.title;
        this.runMappingDownloadForm.controls.fileName.setValue(this.camelCasePipe.transform(title, 'class') + '_Data');
    }
    run(): void {
        if (this.state.editMapping && this.state.isMappingChanged()) {
            this.state.saveMapping().subscribe(id => this._runMapping(id), error => this._onError(error));
        } else {
            this._runMapping(this.state.selected.record.id);
        }
    }

    private _onError(errorMessage: string): void {
        this.errorMessage = errorMessage;
    }
    private _runMapping(id: string): void {
        this.dm.mapAndDownload(id, this.runMappingDownloadForm.controls.serialization.value, this.runMappingDownloadForm.controls.fileName.value);
        this.util.createSuccessToast('Successfully ran mapping');
        this._reset();
    }
    private _reset(): void {
        this.errorMessage = '';
        this.state.step = this.state.selectMappingStep;
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
        this.dialogRef.close();
    }
}