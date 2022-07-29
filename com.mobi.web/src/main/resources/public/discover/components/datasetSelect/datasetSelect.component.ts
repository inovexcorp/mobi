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
import { some, map } from 'lodash';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';

import { DatasetManagerService } from '../../../shared/services/datasetManager.service';

const template = require('./datasetSelect.component.html');

/**
 * @ngdoc component
 * @name discover.component:datasetSelect
 * @requires shared.service:utilService
 * @requires shared.service:datasetManagerService
 *
 * @description
 * `datasetSelect` is a component that provides a `ui-select` of all datasets.
 *
 * @param {string} bindModel The IRI of the dataset record
 * @param {Function} changeEvent A function to be called when the value of the ui-select changes. Expects an argument
 * called `value` and should update the value of `bindModel`.
 * @param {Function} onSelect A function to be called when a new dataset is selected
 */
const datasetSelectComponent = {
    template,
    bindings: {
        bindModel: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: datasetSelectComponentCtrl
};

datasetSelectComponentCtrl.$inject = ['utilService', 'datasetManagerService', 'prefixes'];

function datasetSelectComponentCtrl(utilService, datasetManagerService: DatasetManagerService, prefixes) {
    var dvm = this;
    dvm.dm = datasetManagerService;
    dvm.util = utilService;
    dvm.datasetRecords = [];

    dvm.$onInit = function() {
        const paginatedConfig: PaginatedConfig = {
            sortOption: {
                field: prefixes.dcterms + 'title',
                label: '',
                asc: true
            }
        };
        return dvm.dm.getDatasetRecords(paginatedConfig)
            .subscribe(response => {
                dvm.datasetRecords = map(response.body, dataset => dvm.dm.getRecordFromArray(dataset));
                if (!some(dvm.datasetRecords, {'@id': dvm.bindModel})) {
                    dvm.bindModel = '';
                    dvm.changeEvent({value: dvm.bindModel});
                }
            }, utilService.createErrorToast);
    }
}

export default datasetSelectComponent;
