/*-
 * #%L
 * org.matonto.web
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
        .module('fileForm', [])
        .directive('fileForm', fileForm);

        function fileForm() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    errorMessage: '=',
                    onUploadClick: '&',
                    onContinueClick: '&'
                },
                bindToController: {
                    delimitedFile: '=',
                    separator: '=',
                    containsHeaders: '='
                },
                controller: function() {
                    var dvm = this;
                    if (dvm.delimitedFile) {
                        dvm.uploaded = true;
                    }

                    dvm.isExcel = function() {
                        var fileName = _.get(dvm.delimitedFile, 'name');
                        return _.includes(fileName, 'xls');
                    }
                },
                templateUrl: 'modules/mapper/directives/fileForm/fileForm.html'
            }
        }
})();
