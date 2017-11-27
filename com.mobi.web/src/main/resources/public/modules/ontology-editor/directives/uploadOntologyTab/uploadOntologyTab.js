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
        .module('uploadOntologyTab', [])
        .directive('uploadOntologyTab', uploadOntologyTab);

        uploadOntologyTab.$inject = ['ontologyStateService'];

        function uploadOntologyTab(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/uploadOntologyTab/uploadOntologyTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = ontologyStateService;
                    dvm.files = [];
                    dvm.showOntology = false;

                    dvm.hasStatus = function(promise, value) {
                        return promise.$$state.status === value;
                    }

                    dvm.cancel = function() {
                        dvm.state.showUploadTab = false;
                        dvm.state.clearUploadList();
                    }
                }
            }
        }
})();
