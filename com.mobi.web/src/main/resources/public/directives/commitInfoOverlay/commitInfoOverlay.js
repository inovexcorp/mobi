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
         * @name commitInfoOverlay
         *
         * @description
         * The `commitInfoOverlay` module only provides the `commitInfoOverlay` directive which creates
         * content for a modal with information about a particular commit.
         */
        .module('commitInfoOverlay', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name commitInfoOverlay.directive:commitInfoOverlay
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires userManager.service:userManagerService
         *
         * @description
         * `commitInfoOverlay` is a directive that creates content for a modal displaying information about the passed
         * commit object including a {@link commitChangesDisplay.directive:commitChangesDisplay commit changes display}
         * of the passed additions and deletions for the commit. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Object} resolve Information provided to the modal
         * @param {Object} resolve.commit The commit to display information about
         * @param {string} resolve.commit.id The IRI string identifying the commit
         * @param {string} resolve.commit.message The message associated with the commit
         * @param {Object} resolve commit.creator An object containing information about the creator of the commit,
         * including the username, first name, and last name
         * @param {string} resolve.commit.date The date string of when the commit was created
         * @param {Object[]} resolve.additions An array of JSON-LD objects representing statements added in the commit
         * @param {Object[]} resolve.deletions An array of JSON-LD objects representing statements deleted in the commit
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('commitInfoOverlay', commitInfoOverlay);

        commitInfoOverlay.$inject = ['utilService', 'userManagerService']

        function commitInfoOverlay(utilService, userManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {
                    resolve: '<',
                    dismiss: '&'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.util = utilService;
                    dvm.um = userManagerService;

                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }],
                templateUrl: 'directives/commitInfoOverlay/commitInfoOverlay.html'
            }
        }
})();
