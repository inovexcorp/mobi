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
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyStateService', 'ontologyManagerService'];

        function treeItem(settingsManagerService, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    hasChildren: '<',
                    isActive: '<',
                    isBold: '<',
                    onClick: '&'
                },
                bindToController: {
                    currentEntity: '<',
                    isOpened: '=',
                    path: '<'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();
                    var os = ontologyStateService;
                    var om = ontologyManagerService;

                    dvm.getTreeDisplay = function() {
                        if (treeDisplay === 'pretty') {
                            return om.getEntityName(dvm.currentEntity);
                        }
                        return _.get(dvm.currentEntity, 'mobi.anonymous', '');
                    }

                    dvm.toggleOpen = function() {
                        dvm.isOpened = !dvm.isOpened;
                        os.setOpened(_.join(dvm.path, '.'), dvm.isOpened);
                    }

                    dvm.isSaved = function() {
                        var ids = _.unionWith(_.map(os.listItem.inProgressCommit.additions, '@id'), _.map(os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        return _.includes(ids, _.get(dvm.currentEntity, '@id'));
                    }

                    dvm.saved = dvm.isSaved();

                    $scope.$watch(() => os.listItem.inProgressCommit.additions + os.listItem.inProgressCommit.deletions, () => dvm.saved = dvm.isSaved() );
                }]
            }
        }
})();
