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
import { NgModule } from '@angular/core';
import { GridJsAngularModule } from 'gridjs-angular';

import { SharedModule } from '../shared/shared.module';

import { ClassMappingDetailsComponent } from './components/classMappingDetails/classMappingDetails.component';
import { ClassMappingOverlayComponent } from './components/classMappingOverlay/classMappingOverlay.component';
import { ClassMappingSelectComponent } from './components/classMappingSelect/classMappingSelect.component';
import { ClassPreviewComponent } from './components/classPreview/classPreview.component';
import { ClassSelectComponent } from './components/classSelect/classSelect.component';
import { ColumnSelectComponent } from './components/columnSelect/columnSelect.component';
import { CreateMappingOverlayComponent } from './components/createMappingOverlay/createMappingOverlay.component';
import { DownloadMappingOverlayComponent } from './components/downloadMappingOverlay/downloadMappingOverlay.component';
import { EditMappingPageComponent } from './components/editMappingPage/editMappingPage.component';
import { EditMappingTabComponent } from './components/editMappingTab/editMappingTab.component';
import { FileUploadFormComponent } from './components/fileUploadForm/fileUploadForm.component';
import { FileUploadPageComponent } from './components/fileUploadPage/fileUploadPage.component';
import { IriTemplateOverlayComponent } from './components/iriTemplateOverlay/iriTemplateOverlay.component';
import { MapperPageComponent } from './components/mapperPage/mapperPage.component';
import { MapperSerializationSelectComponent } from './components/mapperSerializationSelect/mapperSerializationSelect.component';
import { MappingCommitsTabComponent } from './components/mappingCommitsTab/mappingCommitsTab.component';
import { MappingConfigOverlayComponent } from './components/mappingConfigOverlay/mappingConfigOverlay.component';
import { MappingPreviewComponent } from './components/mappingPreview/mappingPreview.component';
import { MappingSelectPageComponent } from './components/mappingSelectPage/mappingSelectPage.component';
import { PreviewDataGridComponent } from './components/previewDataGrid/previewDataGrid.component';
import { PropMappingOverlayComponent } from './components/propMappingOverlay/propMappingOverlay.component';
import { PropPreviewComponent } from './components/propPreview/propPreview.component';
import { PropSelectComponent } from './components/propSelect/propSelect.component';
import { RdfPreviewTabComponent } from './components/rdfPreviewTab/rdfPreviewTab.component';
import { RunMappingDatasetOverlayComponent } from './components/runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from './components/runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from './components/runMappingOntologyOverlay/runMappingOntologyOverlay.component';
import { ViewMappingModalComponent } from './components/viewMappingModal/viewMappingModal.component';

/**
 * @namespace mapper
 *
 * The `mapper` module provides components that make up the Mapping Tool module in the Mobi application.
 */
@NgModule({
    imports: [
        SharedModule,
        GridJsAngularModule
    ],
    declarations: [
        ClassMappingDetailsComponent,
        ClassMappingOverlayComponent,
        ClassMappingSelectComponent,
        ClassPreviewComponent,
        ClassSelectComponent,
        ColumnSelectComponent,
        CreateMappingOverlayComponent,
        DownloadMappingOverlayComponent,
        EditMappingPageComponent,
        EditMappingTabComponent,
        FileUploadFormComponent,
        FileUploadPageComponent,
        IriTemplateOverlayComponent,
        MapperPageComponent,
        MapperSerializationSelectComponent,
        MappingCommitsTabComponent,
        MappingConfigOverlayComponent,
        MappingPreviewComponent,
        MappingSelectPageComponent,
        PreviewDataGridComponent,
        PropMappingOverlayComponent,
        PropPreviewComponent,
        PropSelectComponent,
        RdfPreviewTabComponent,
        RunMappingDatasetOverlayComponent,
        RunMappingDownloadOverlayComponent,
        RunMappingOntologyOverlayComponent,
        ViewMappingModalComponent
    ]
})
export class MapperModule {}
