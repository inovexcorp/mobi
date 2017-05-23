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
         * @name commitChangesDisplay
         *
         * @description
         * The `commitChangesDisplay` module only provides the `commitChangesDisplay` directive which creates
         * a display of all the changes from a commit separated by subject.
         */
        .module('commitChangesDisplay', [])
        /**
         * @ngdoc directive
         * @name commitChangesDisplay.directive:commitChangesDisplay
         * @scope
         * @restrict E
         * @requires util.service:utilService
         *
         * @description
         * `commitChangesDisplay` is a directive that creates a sequence of divs displaying the changes made to
         * entities separated by additions and deletions. Each changes display uses the property-values class.
         * The IRI of each entity can optionally be a link which calls the passed clickEvent function. The directive
         * is replaced by the content of the template.
         *
         * @param {Function=undefined} clickEvent An optional function to be called when the IRI of a entity is clicked.
         * @param {Object[]} additions An array of JSON-LD objects representing statements added
         * @param {Object[]} deletions An array of JSON-LD objects representing statements deleted
         */
        .directive('commitChangesDisplay', commitChangesDisplay);

        commitChangesDisplay.$inject = ['$filter', 'utilService', 'prefixes']

        function commitChangesDisplay($filter, utilService, prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    additions: '<',
                    deletions: '<'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.size = 100;
                    dvm.index = 0;
                    dvm.total = 0;
                    dvm.shown = 0;
                    dvm.id = 'commit-changes';
                    dvm.util = utilService;
                    dvm.list = [];
                    dvm.results = getResults();

                    dvm.getMoreResults = function() {
                        dvm.index++;
                        _.forEach(_.get(_.chunk(_.get(dvm.getActivePage(), 'commit-changes', []), dvm.size), dvm.index, []), binding => addToResults(dvm.results, binding));
                    }

                    $scope.$watchGroup(['dvm.additions', 'dvm.deletions'], () => {
                        dvm.list = _.unionWith(_.map(dvm.additions, '@id'), _.map(dvm.deletions, '@id'), _.isEqual);
                        dvm.results = getResults();
                    }, function() {
                         dvm.size = 100;
                         dvm.index = 0;
                         dvm.shown = 0;
                         dvm.results = getResults();
                     });

                    function getResults() {
                        var results = {};
                        dvm.total = dvm.list.length;
                        var chunks = _.chunk(dvm.list, dvm.size);
                        dvm.chunks = chunks.length === 0 ? 0 : chunks.length - 1;
                        _.forEach(dvm.list, id => {
                            results[id] = {
                                additions: dvm.util.getChangesById(id, dvm.additions),
                                deletions: dvm.util.getChangesById(id, dvm.deletions)
                            }
                        });
                        dvm.shown = results.size;
                        return results;
                    }

                    function addToResults(results, binding) {
                        results[binding.id] = _.union(_.get(results, binding.id, []), [{additions: binding.id.additions, deletions: binding.id.deletions}]);
                    }
                }],
                templateUrl: 'directives/commitChangesDisplay/commitChangesDisplay.html'
            }
        }
})();
