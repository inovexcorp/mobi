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
         * @name uploadOntologyTab
         *
         * @description
         * The `uploadOntologyTab` module only provides the `uploadOntologyTab` directive which creates
         * page for uploading ontologies.
         */
        .module('uploadOntologyTab', [])
        /**
         * @ngdoc directive
         * @name uploadOntologyTab.directive:uploadOntologyTab
         * @scope
         * @restrict E
         * @requires httpService.service:httpService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `uploadOntologyTab` is a directive that creates a page for uploading ontologies. The page includes a
         * {@link dragFile.directive:dragFile} area for dragging/dropping to upload and a display of the list of
         * ontologies actively being uploaded to the Mobi instance. There is also a button for navigating back to the
         * {@link openOntologyTab.directive:openOntologyTab}. The directive houses a method for
         * {@link uploadOntologyOverlay.directive:uploadOntologyOverlay uploading ontologies}. The directive is replaced
         * by the contents of its template.
         */
        .directive('uploadOntologyTab', uploadOntologyTab);

        uploadOntologyTab.$inject = ['httpService', 'ontologyStateService', 'modalService'];

        function uploadOntologyTab(httpService, ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/uploadOntologyTab/uploadOntologyTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = ontologyStateService;
                    dvm.showOntology = false;

                    dvm.showUploadOntologyOverlay = function() {
                        modalService.openModal('uploadOntologyOverlay');
                    }
                    dvm.hasStatus = function(promise, value) {
                        return _.get(promise, '$$state.status') === value;
                    }
                    dvm.cancel = function() {
                        dvm.state.showUploadTab = false;
                        dvm.state.uploadList = [];
                        dvm.state.uploadFiles = [];
                    }
                    dvm.hasPending = function() {
                        return _.some(dvm.state.uploadList, item => httpService.isPending(item.id));
                    }
                }
            }
        }
})();
