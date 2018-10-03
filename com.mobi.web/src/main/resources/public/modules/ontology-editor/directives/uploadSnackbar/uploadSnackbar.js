/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * The `uploadSnackbar` module only provides the `uploadSnackbar` directive which 
         */
        .module('uploadSnackbar', [])
        /**
         * @ngdoc directive
         * @name uploadSnackbar.directive:uploadSnackbar
         * @scope
         * @restrict E
         * @requires httpService.service:httpService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `uploadSnackbar` is a directive that 
         */
        .directive('uploadSnackbar', uploadSnackbar);

        uploadSnackbar.$inject = ['httpService', 'ontologyStateService', 'modalService'];

        function uploadSnackbar(httpService, ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/uploadSnackbar/uploadSnackbar.html',
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
                    }
                    dvm.hasPending = function() {
                        return _.some(dvm.state.uploadList, dvm.isPending);
                    }
                    $scope.$on('$destroy', () => {
                        dvm.close();
                    });
                }]
            }
        }
})();
