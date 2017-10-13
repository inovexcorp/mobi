/*-
 * #%L
 * com.mobi.web
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
         * @name datasetFormGroup
         *
         * @description
         * The `datasetFormGroup` module only provides the `datasetFormGroup` directive which creates
         * the dataset select wrapped with a .form-group element and provides a clear action.
         */
        .module('datasetFormGroup', [])
        /**
         * @ngdoc directive
         * @name datasetSelect.directive:datasetSelect
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the dataset select which provides a dropdown select of all datasets with a
         * clear button.
         */
        .directive('datasetFormGroup', datasetFormGroup);

        function datasetFormGroup() {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/directives/datasetFormGroup/datasetFormGroup.html',
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

                    dvm.clear = function() {
                        dvm.bindModel = '';
                    }
                }
            }
        }
})();