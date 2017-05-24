/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name datasetSelect
         *
         * @description
         * The `datasetSelect` module only provides the `datasetSelect` directive which creates
         * the dataset select.
         */
        .module('datasetSelect', [])
        /**
         * @ngdoc directive
         * @name datasetSelect.directive:datasetSelect
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires datasetManager.service:datasetManagerService
         *
         * @description
         * HTML contents in the dataset select which provides a list of all datasets.
         */
        .directive('datasetSelect', datasetSelect);
        
        datasetSelect.$inject = ['utilService', 'datasetManagerService'];

        function datasetSelect(utilService, datasetManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/directives/datasetSelect/datasetSelect.html',
                replace: true,
                scope: {
                    onSelect: '&?'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.dm = datasetManagerService;
                    dvm.util = utilService;

                    if (!_.some(dvm.dm.datasetRecords, {'@id': dvm.bindModel})) {
                        dvm.bindModel = '';
                    }
                }
            }
        }
})();