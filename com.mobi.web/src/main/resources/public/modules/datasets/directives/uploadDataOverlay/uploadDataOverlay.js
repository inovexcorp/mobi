/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name uploadDataOverlay
         *
         * @description
         * The `uploadDataOverlay` module only provides the `uploadDataOverlay` directive which creates
         * creates overlays with forms to create a Dataset Record.
         */
        .module('uploadDataOverlay', [])
        /**
         * @ngdoc directive
         * @name uploadDataOverlay.directive:uploadDataOverlay
         * @scope
         * @restrict E
         * @requires datasetManager.service:datasetManagerService
         * @requires datasetState.service:datasetStateService
         * @requires util.service:utilService
         *
         * @description
         * `uploadDataOverlay` is a directive that creates an overlay with a form to select an RDF file to import
         * into the selected dataset. The directive is replaced by the contents of its template.
         *
         * @param {Function} onClose The method to be called when closing the overlay
         */
        .directive('uploadDataOverlay', uploadDataOverlay);

        uploadDataOverlay.$inject = ['datasetManagerService', 'datasetStateService', 'utilService', 'httpService'];

        function uploadDataOverlay(datasetManagerService, datasetStateService, utilService, httpService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/datasets/directives/uploadDataOverlay/uploadDataOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var state = datasetStateService;
                    var dm = datasetManagerService;
                    var util = utilService;
                    dvm.error = '';
                    dvm.fileObj = undefined;
                    dvm.datasetTitle = util.getDctermsValue(state.selectedDataset.record, 'title');
                    dvm.uploadId = 'upload-dataset-data';
                    dvm.importing = false;

                    dvm.upload = function() {
                        dvm.importing = true;
                        dm.uploadData(state.selectedDataset.record['@id'], dvm.fileObj, dvm.uploadId)
                            .then(() => {
                                dvm.importing = false;
                                util.createSuccessToast("Data successfully uploaded to " + dvm.datasetTitle);
                                dvm.onClose();
                            }, onError);
                    }
                    dvm.cancel = function() {
                        httpService.cancel(dvm.uploadId);
                        dvm.onClose();
                    }

                    function onError(errorMessage) {
                        dvm.importing = false;
                        dvm.error = errorMessage;
                    }
                }
            }
        }
})();
