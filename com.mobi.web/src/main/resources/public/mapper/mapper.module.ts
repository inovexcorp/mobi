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
import * as angular from 'angular';

import classMappingDetailsComponent from './components/classMappingDetails/classMappingDetails.component';
import classMappingOverlayComponent from './components/classMappingOverlay/classMappingOverlay.component';
import classMappingSelectComponent from './components/classMappingSelect/classMappingSelect.component';
import classPreviewComponent from './components/classPreview/classPreview.component';
import classSelectComponent from './components/classSelect/classSelect.component';
import columnSelectComponent from './components/columnSelect/columnSelect.component';
import createMappingOverlayComponent from './components/createMappingOverlay/createMappingOverlay.component';
import downloadMappingOverlayComponent from './components/downloadMappingOverlay/downloadMappingOverlay.component';
import editMappingFormComponent from './components/editMappingForm/editMappingForm.component';
import editMappingPageComponent from './components/editMappingPage/editMappingPage.component';
import fileUploadFormComponent from './components/fileUploadForm/fileUploadForm.component';
import fileUploadPageComponent from './components/fileUploadPage/fileUploadPage.component';
import iriTemplateOverlayComponent from './components/iriTemplateOverlay/iriTemplateOverlay.component';
import mapperPageComponent from './components/mapperPage/mapperPage.component';
import mapperSerializationSelectComponent from './components/mapperSerializationSelect/mapperSerializationSelect.component';
import mappingCommitsPageComponent from './components/mappingCommitsPage/mappingCommitsPage.component';
import mappingConfigOverlayComponent from './components/mappingConfigOverlay/mappingConfigOverlay.component';
import mappingListBlockComponent from './components/mappingListBlock/mappingListBlock.component';
import mappingPreviewComponent from './components/mappingPreview/mappingPreview.component';
import mappingSelectPageComponent from './components/mappingSelectPage/mappingSelectPage.component';
import previewDataGridComponent from './components/previewDataGrid/previewDataGrid.component';
import propMappingOverlayComponent from './components/propMappingOverlay/propMappingOverlay.component';
import propPreviewComponent from './components/propPreview/propPreview.component';
import propSelectComponent from './components/propSelect/propSelect.component';
import rdfPreviewFormComponent from './components/rdfPreviewForm/rdfPreviewForm.component';
import runMappingDatasetOverlayComponent from './components/runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import runMappingDownloadOverlayComponent from './components/runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import runMappingOntologyOverlayComponent from './components/runMappingOntologyOverlay/runMappingOntologyOverlay.component';

/**
 * @ngdoc overview
 * @name mapper
 *
 * @description
 * The `mapper` module provides components that make up the Mapping Tool module in the Mobi application.
 */
angular.module('mapper', [])
    .component('classMappingDetails', classMappingDetailsComponent)
    .component('classMappingOverlay', classMappingOverlayComponent)
    .component('classMappingSelect', classMappingSelectComponent)
    .component('classPreview', classPreviewComponent)
    .component('classSelect', classSelectComponent)
    .component('columnSelect', columnSelectComponent)
    .component('createMappingOverlay', createMappingOverlayComponent)
    .component('downloadMappingOverlay', downloadMappingOverlayComponent)
    .component('editMappingForm', editMappingFormComponent)
    .component('editMappingPage', editMappingPageComponent)
    .component('fileUploadForm', fileUploadFormComponent)
    .component('fileUploadPage', fileUploadPageComponent)
    .component('iriTemplateOverlay', iriTemplateOverlayComponent)
    .component('mapperPage', mapperPageComponent)
    .component('mapperSerializationSelect', mapperSerializationSelectComponent)
    .component('mappingCommitsPage', mappingCommitsPageComponent)
    .component('mappingConfigOverlay', mappingConfigOverlayComponent)
    .component('mappingListBlock', mappingListBlockComponent)
    .component('mappingPreview', mappingPreviewComponent)
    .component('mappingSelectPage', mappingSelectPageComponent)
    .component('previewDataGrid', previewDataGridComponent)
    .component('propMappingOverlay', propMappingOverlayComponent)
    .component('propPreview', propPreviewComponent)
    .component('propSelect', propSelectComponent)
    .component('rdfPreviewForm', rdfPreviewFormComponent)
    .component('runMappingDatasetOverlay', runMappingDatasetOverlayComponent)
    .component('runMappingDownloadOverlay', runMappingDownloadOverlayComponent)
    .component('runMappingOntologyOverlay', runMappingOntologyOverlayComponent);
