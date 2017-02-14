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
        /**
         * @ngdoc overview
         * @name commitHistoryTable
         *
         */
        .module('commitHistoryTable', [])
        /**
         * @ngdoc directive
         * @name commitHistoryTable.directive:commitHistoryTable
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires userManager.service:userManagerService
         *
         */
        .directive('commitHistoryTable', commitHistoryTable);

        commitHistoryTable.$inject = ['catalogManagerService', 'utilService', 'userManagerService'];

        function commitHistoryTable(catalogManagerService, utilService, userManagerService) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                bindToController: {
                    recordId: '<',
                    branchId: '<',
                    commitId: '<?'
                },
                templateUrl: 'directives/commitHistoryTable/commitHistoryTable.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.util = utilService;
                    dvm.um = userManagerService;
                    dvm.error = '';
                    dvm.commits = [];

                    $scope.$watchGroup(['dvm.branchId', 'dvm.recordId', 'dvm.commitId'], newValues => {
                        getCommits();
                    });

                    function getCommits() {
                        cm.getBranchCommits(dvm.branchId, dvm.recordId, catalogId)
                            .then(commits => {
                                dvm.commits = commits;
                                dvm.error = '';
                            }, errorMessage => {
                                dvm.error = errorMessage;
                                dvm.commits = [];
                            });
                    }

                    getCommits();
                }]
            }
        }
})();
