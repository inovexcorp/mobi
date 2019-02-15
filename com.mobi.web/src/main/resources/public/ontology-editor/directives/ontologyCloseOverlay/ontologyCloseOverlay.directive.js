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
         * @name ontologyCloseOverlay
         *
         * @description
         * The `ontologyCloseOverlay` module only provides the `ontologyCloseOverlay` directive which creates content
         * for a modal to close an ontology.
         */
        .module('ontologyCloseOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologyCloseOverlay.directive:ontologyCloseOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `ontologyCloseOverlay` is a directive that creates content for a modal that will close the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The modal provides buttons to Cancel
         * the close, close without saving, or save and then close. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('ontologyCloseOverlay', ontologyCloseOverlay);

        ontologyCloseOverlay.$inject = ['$q', 'ontologyStateService'];

        function ontologyCloseOverlay($q, ontologyStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyCloseOverlay/ontologyCloseOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.error = '';

                    dvm.saveThenClose = function() {
                        dvm.os.saveChanges(dvm.os.listItem.ontologyRecord.recordId, {additions: dvm.os.listItem.additions, deletions: dvm.os.listItem.deletions})
                            .then(() => dvm.os.afterSave(), $q.reject)
                            .then(() => dvm.close(), errorMessage => dvm.error = errorMessage);
                    }
                    dvm.close = function() {
                        dvm.os.closeOntology(dvm.os.recordIdToClose);
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
