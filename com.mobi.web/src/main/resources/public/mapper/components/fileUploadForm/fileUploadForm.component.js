/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name mapper.component:fileUploadForm
     * @requires shared.service:delimitedManagerService
     * @requires shared.service:mapperStateService
     *
     * @description
     * `fileUploadForm` is a component that creates a form for uploaded delimited data into Mobi using the
     * {@link shared.service:delimitedManagerService delimitedManagerService}. If the chosen file is a SV file, the user
     * must select a separator for the columns and selecting a new value will automatically upload the file again. Tests
     * whether the selected file is compatible with the current {@link shared.service:mapperStateService mapping} and
     * outputs a list of any invalid data property mappings.
     */
    const fileUploadFormComponent = {
        templateUrl: 'mapper/components/fileUploadForm/fileUploadForm.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: fileUploadFormComponentCtrl
    };

    fileUploadFormComponentCtrl.$inject = ['$q', 'delimitedManagerService', 'mapperStateService'];

    function fileUploadFormComponentCtrl($q, delimitedManagerService, mapperStateService) {
        var dvm = this;
        dvm.state = mapperStateService;
        dvm.dm = delimitedManagerService;
        dvm.errorMessage = '';

        dvm.isExcel = function() {
            var fileName = _.get(dvm.dm.fileObj, 'name', '');
            return _.includes(fileName, 'xls');
        }
        dvm.upload = function(value) {
            dvm.dm.fileObj = value;
            if (dvm.dm.fileObj) {
                dvm.dm.upload(dvm.dm.fileObj).then(data => {
                    dvm.dm.fileName = data;
                    dvm.errorMessage = '';
                    return dvm.dm.previewFile(50);
                }, $q.reject).then(() => dvm.state.setInvalidProps(), onError);
            }
        }
        dvm.changeSeparator = function(value) {
            dvm.dm.separator = value;
            dvm.dm.previewFile(50).then(() => {
                dvm.errorMessage = '';
                dvm.state.setInvalidProps();
            }, onError);
        }

        function onError(errorMessage) {
            dvm.errorMessage = errorMessage;
            dvm.dm.dataRows = undefined;
            dvm.state.invalidProps = [];
        }
    }

    angular.module('mapper')
        .component('fileUploadForm', fileUploadFormComponent);
})();
