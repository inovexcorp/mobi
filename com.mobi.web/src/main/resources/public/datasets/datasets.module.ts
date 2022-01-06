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

import datasetsListComponent from './components/datasetsList/datasetsList.component';
import datasetsOntologyPickerComponent from './components/datasetsOntologyPicker/datasetsOntologyPicker.component';
import datasetsPageComponent from './components/datasetsPage/datasetsPage.component';
import datasetsTabsetComponent from './components/datasetsTabset/datasetsTabset.component';
import editDatasetOverlayComponent from './components/editDatasetOverlay/editDatasetOverlay.component';
import newDatasetOverlayComponent from './components/newDatasetOverlay/newDatasetOverlay.component';
import uploadDataOverlayComponent from './components/uploadDataOverlay/uploadDataOverlay.component';

/**
 * @ngdoc overview
 * @name datasets
 *
 * @description
 * The `datasets` module provides components that make up the Datasets module in the Mobi application.
 */
angular.module('datasets', [])
    .component('datasetsList', datasetsListComponent)
    .component('datasetsOntologyPicker', datasetsOntologyPickerComponent)
    .component('datasetsPage', datasetsPageComponent)
    .component('datasetsTabset', datasetsTabsetComponent)
    .component('editDatasetOverlay', editDatasetOverlayComponent)
    .component('newDatasetOverlay', newDatasetOverlayComponent)
    .component('uploadDataOverlay', uploadDataOverlayComponent);
