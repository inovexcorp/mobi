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
        .module('characteristicsBlock', [])
        .directive('characteristicsBlock', characteristicsBlock);

        characteristicsBlock.$inject = ['prefixes', 'ontologyManagerService', 'ontologyStateService'];

        function characteristicsBlock(prefixes, ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/characteristicsBlock/characteristicsBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var functionalPropertyIRI = prefixes.owl + 'FunctionalProperty';

                    dvm.os = ontologyStateService;
                    dvm.functional = false;

                    dvm.onChange = function() {
                        if (dvm.functional) {
                            _.set(dvm.os.selected, '@type', _.concat(_.get(dvm.os.selected, '@type', []), [functionalPropertyIRI]));
                            handleCase(dvm.os.listItem.deletions, om.addToAdditions);
                        } else {
                            removeTypeFrom(dvm.os.selected, functionalPropertyIRI);
                            handleCase(dvm.os.listItem.additions, om.addToDeletions);
                        }
                    }

                    function handleCase(array, method) {
                        var statement = {
                            '@id': angular.copy(dvm.os.selected['@id']),
                            '@type': [functionalPropertyIRI]
                        }
                        var match = _.find(array, item => _.includes(_.get(item, '@type', []), functionalPropertyIRI));
                        if (match) {
                            removeTypeFrom(match, functionalPropertyIRI);
                            if (!_.get(match, '@type', []).length) {
                                _.unset(match, '@type');
                            }
                            if (_.keys(match).length === 1 && _.has(match, '@id')) {
                                _.remove(array, item => _.get(item, '@id', '') === match['@id']);
                            }
                        } else {
                            method(dvm.os.listItem.recordId, statement);
                        }
                    }

                    function removeTypeFrom(object, typeToRemove) {
                        _.remove(_.get(object, '@type', []), type => type === typeToRemove);
                    }

                    function setVariables() {
                        dvm.functional = _.includes(_.get(dvm.os.selected, '@type', []), functionalPropertyIRI);
                    }

                    setVariables();

                    $scope.$watch('dvm.os.selected', setVariables);
                }]
            }
        }
})();
