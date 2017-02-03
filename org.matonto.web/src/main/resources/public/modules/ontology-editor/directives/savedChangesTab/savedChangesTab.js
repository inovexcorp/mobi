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
        .module('savedChangesTab', [])
        .directive('savedChangesTab', savedChangesTab);

        savedChangesTab.$inject = ['ontologyStateService', 'ontologyManagerService', 'utilService',
            'catalogManagerService'];

        function savedChangesTab(ontologyStateService, ontologyManagerService, utilService, catalogManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/savedChangesTab/savedChangesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.util = utilService;

                    function getList() {
                        var inProgressCommit = dvm.os.listItem.inProgressCommit;
                        return _.unionWith(_.map(inProgressCommit.additions, '@id'),
                            _.map(inProgressCommit.deletions, '@id'), _.isEqual);
                    }

                    function getInProgressCommitComponent(id, prop) {
                        var entity = angular.copy(_.find(dvm.os.listItem.inProgressCommit[prop], {'@id': id}));
                        _.unset(entity, '@id');
                        return entity;
                    }

                    dvm.getAdditions = function(id) {
                        return getInProgressCommitComponent(id, 'additions');
                    }

                    dvm.getDeletions = function(id) {
                        return getInProgressCommitComponent(id, 'deletions');
                    }

                    dvm.go = function($event, id) {
                        $event.stopPropagation();
                        dvm.os.goTo(id);
                    }

                    dvm.update = function() {
                        cm.getBranchHeadCommit(dvm.os.listItem.branchId, dvm.os.listItem.recordId, catalogId)
                            .then(headCommit => {
                                var commitId = _.get(headCommit, "commit", '');
                                dvm.om.updateOntology(dvm.os.listItem.recordId, dvm.os.listItem.branchId, commitId,
                                    dvm.os.listItem.type).then(() =>
                                        dvm.util.createSuccessToast('Your ontology has been updated.'),
                                        dvm.util.createErrorToast);
                            });
                    }

                    dvm.list = getList();

                    $scope.$watch(function() {
                        return dvm.os.listItem.inProgressCommit.additions + dvm.os.listItem.inProgressCommit.deletions;
                    }, function() {
                        dvm.list = getList();
                    });
                }]
            }
        }
})();
