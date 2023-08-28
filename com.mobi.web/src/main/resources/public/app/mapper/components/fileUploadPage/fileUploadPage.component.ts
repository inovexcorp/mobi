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
import { MatDialog } from '@angular/material/dialog';
import { get, head } from 'lodash';

import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { RunMappingDatasetOverlayComponent } from '../runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from '../runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from '../runMappingOntologyOverlay/runMappingOntologyOverlay.component';

/**
 * @class mapper.FileUploadPageComponent
 *
 * A component that creates a Bootstrap `row` div with two columns containing sections for uploading and previewing
 * delimited data. The left column contains a {@link mapper.FileUploadFormComponent} and buttons to cancel the current
 * workflow or continue. If there are invalid property mapping in the current mapping, you can only continue if editing
 * a mapping. The right column contains a {@link mapper.PreviewDataGridComponent} of the loaded delimited data.
 */
@Component({
    selector: 'file-upload-page',
    templateUrl: './fileUploadPage.component.html',
    styleUrls: ['./fileUploadPage.component.scss']
})
export class FileUploadPageComponent implements OnInit{
    shouldDisplayPreview = false;

    constructor(public state: MapperStateService, public dm: DelimitedManagerService, private dialog: MatDialog) {}
    
    ngOnInit(): void {
       this.shouldDisplayPreview = (!this.state.editMapping) ||
           (!this.state.editMapping && !this.state.newMapping && this.state.invalidProps.length > 0);
    }
    runMappingDownload(): void {
        this.dialog.open(RunMappingDownloadOverlayComponent);
    }
    runMappingDataset(): void {
        this.dialog.open(RunMappingDatasetOverlayComponent);
    }
    runMappingOntology(): void {
        this.dialog.open(RunMappingOntologyOverlayComponent);
    }
    cancel(): void {
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
    }
    edit(): void {
        const classMappings = this.state.selected.mapping.getAllClassMappings();
        this.state.selectedClassMappingId = get(head(classMappings), '@id', '');
        this.state.step = this.state.editMappingStep;
        if (this.state.newMapping) {
            this.state.startWithConfigModal = true;
        }
    }
}
