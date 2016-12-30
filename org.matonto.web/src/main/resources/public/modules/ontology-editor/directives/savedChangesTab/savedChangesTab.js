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

        savedChangesTab.$inject = ['ontologyStateService', 'ontologyManagerService'];

        function savedChangesTab(ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/savedChangesTab/savedChangesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    function getList() {
                        var inProgressCommit = dvm.os.listItem.inProgressCommit;
                        return _.unionWith(_.map(inProgressCommit.additions, '@id'),
                            _.map(inProgressCommit.deletions, '@id'), _.isEqual);
                    }

                    function contains(id, entityProp, listItemProp) {
                        return _.has(_.find(dvm.os.listItem.inProgressCommit[listItemProp], {'@id': id}), entityProp);
                    }

                    dvm.isDeletion = function(id, property) {
                        return contains(id, property, 'deletions');
                    }

                    dvm.isAddition = function(id, property) {
                        return contains(id, property, 'additions');
                    }

                    dvm.getAdditions = function(id) {
                        var entity = angular.copy(_.find(dvm.os.listItem.inProgressCommit.additions, {'@id': id}));
                        _.unset(entity, '@id');
                        return entity;
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
