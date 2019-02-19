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

    angular
        /**
         * @ngdoc overview
         * @name uploadSnackbar
         *
         * @description
         * The `uploadSnackbar` module only provides the `uploadSnackbar` directive which creates a Material Design
         * `snackbar` with the list of ontologies being uploaded.
         */
        .module('uploadSnackbar', [])
        /**
         * @ngdoc directive
         * @name uploadSnackbar.directive:uploadSnackbar
         * @scope
         * @restrict E
         * @requires shared.service:httpService
         * @requires shared.service:ontologyStateService
         *
         * @description
         * `uploadSnackbar` is a directive that creates a custom Material Design `snackbar` on the right of the screen
         * with a body containing the list of ontologies currently being uploaded. The list displays the ontology record
         * title and an indicator of the status of the upload. The header of the snackbar contains an indicator of how
         * many ontologies have been uploaded and buttons to minimize the body of the snackbar and close it. Whether the
         * snackbar should be shown is handled by the provided boolean variable.
         *
         * @param {boolean} showSnackbar Whether the snackbar should have the `show` styles applied
         */
        .directive('uploadSnackbar', uploadSnackbar);

        uploadSnackbar.$inject = ['httpService', 'ontologyStateService', 'modalService'];

        function uploadSnackbar(httpService, ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/uploadSnackbar/uploadSnackbar.directive.html',
                scope: {},
                bindToController: {
                    showSnackbar: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.state = ontologyStateService;
                    dvm.showOntology = false;

                    dvm.hasStatus = function(promise, value) {
                        return _.get(promise, '$$state.status') === value;
                    }
                    dvm.isPending = function(item) {
                        return httpService.isPending(item.id);
                    }
                    dvm.attemptClose = function() {
                        if (dvm.hasPending()) {
                            modalService.openConfirmModal('Close the snackbar will cancel all pending uploads. Are you sure you want to proceed?', dvm.close);
                        } else {
                            dvm.close();
                        }
                    }
                    dvm.close = function() {
                        dvm.showSnackbar = false;
                        _.forEach(dvm.state.uploadList, item => httpService.cancel(item.id));
                        dvm.state.uploadList = [];
                        dvm.state.uploadFiles = [];
                        dvm.state.uploadPending = 0;
                    }
                    dvm.hasPending = function() {
                        return _.some(dvm.state.uploadList, dvm.isPending);
                    }
                    dvm.getTitle = function() {
                        dvm.state.uploadPending = dvm.getNumberPending();
                        if (dvm.hasPending()) {
                            return 'Uploading ' + (dvm.state.uploadPending === 1 ? '1 item' : dvm.state.uploadPending + ' items');
                        } else {
                            return dvm.state.uploadList.length + ' uploads complete';
                        }
                    }
                    dvm.getNumberPending = function() {
                        return _.filter(dvm.state.uploadList, dvm.isPending).length;
                    }

                    $scope.$on('$destroy', () => {
                        dvm.close();
                    });
                }]
            }
        }
})();
