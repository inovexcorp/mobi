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
import { NgModule } from '@angular/core';
import * as angular from 'angular';
import { downgradeComponent } from '@angular/upgrade/static';

import { SharedModule } from '../shared/shared.module';

import { DatasetsListComponent } from './components/datasetsList/datasetsList.component';
import { DatasetsOntologyPickerComponent } from './components/datasetsOntologyPicker/datasetsOntologyPicker.component';
import { DatasetsPageComponent } from './components/datasetsPage/datasetsPage.component';
import { EditDatasetOverlayComponent } from './components/editDatasetOverlay/editDatasetOverlay.component';
import { NewDatasetOverlayComponent } from './components/newDatasetOverlay/newDatasetOverlay.component';
import { UploadDataOverlayComponent } from './components/uploadDataOverlay/uploadDataOverlay.component';

/**
 * @namespace datasets
 *
 * The `datasets` module provides components that make up the Datasets module in the Mobi application.
 */
@NgModule({
    imports: [ SharedModule ],
    declarations: [
        DatasetsListComponent,
        DatasetsOntologyPickerComponent,
        DatasetsPageComponent,
        EditDatasetOverlayComponent,
        NewDatasetOverlayComponent,
        UploadDataOverlayComponent
    ],
    entryComponents: [
        DatasetsPageComponent,
        EditDatasetOverlayComponent,
        NewDatasetOverlayComponent,
        UploadDataOverlayComponent
    ]
})
export class DatasetsModule {}

angular.module('datasets', [])
    .directive('datasetsList', downgradeComponent({component: DatasetsListComponent}) as angular.IDirectiveFactory)
    .directive('datasetsOntologyPicker', downgradeComponent({component: DatasetsOntologyPickerComponent}) as angular.IDirectiveFactory)
    .directive('datasetsPage', downgradeComponent({component: DatasetsPageComponent}) as angular.IDirectiveFactory)
    .directive('editDatasetOverlay', downgradeComponent({component: EditDatasetOverlayComponent}) as angular.IDirectiveFactory)
    .directive('newDatasetOverlay', downgradeComponent({component: NewDatasetOverlayComponent}) as angular.IDirectiveFactory)
    .directive('uploadDataOverlay', downgradeComponent({component: UploadDataOverlayComponent}) as angular.IDirectiveFactory);
