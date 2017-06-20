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

        characteristicsBlock.$inject = ['prefixes', 'ontologyStateService', 'ontologyUtilsManagerService'];

        function characteristicsBlock(prefixes, ontologyStateService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/characteristicsBlock/characteristicsBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.characteristics = {
                        functional: {
                            checked: false,
                            typeIRI: prefixes.owl + 'FunctionalProperty',
                            displayText: 'Functional Property'
                        },
                        asymmetric: {
                            checked: false,
                            typeIRI: prefixes.owl + 'AsymmetricProperty',
                            displayText: 'Asymmetric Property'
                        }
                    };

                    dvm.onChange = function(characteristicObj) {
                        if (characteristicObj.checked) {
                            _.set(dvm.os.selected, '@type', _.concat(_.get(dvm.os.selected, '@type', []), characteristicObj.typeIRI));
                            handleCase(dvm.os.listItem.deletions, dvm.os.addToAdditions, characteristicObj.typeIRI);
                        } else {
                            removeTypeFrom(dvm.os.selected, characteristicObj.typeIRI);
                            handleCase(dvm.os.listItem.additions, dvm.os.addToDeletions, characteristicObj.typeIRI);
                        }
                        ontoUtils.saveCurrentChanges();
                    }

                    function handleCase(array, method, typeIRI) {
                        var match = _.find(array, item => _.includes(_.get(item, '@type', []), typeIRI));
                        if (match) {
                            removeTypeFrom(match, typeIRI);
                            if (!_.get(match, '@type', []).length) {
                                _.unset(match, '@type');
                            }
                            if (_.isEqual(_.keys(match), ['@id'])) {
                                _.remove(array, match);
                            }
                        } else {
                            method(dvm.os.listItem.recordId, {
                                '@id': dvm.os.selected['@id'],
                                '@type': [typeIRI]
                            });
                        }
                    }

                    function removeTypeFrom(object, typeToRemove) {
                        _.remove(_.get(object, '@type', []), type => type === typeToRemove);
                    }

                    function setVariables() {
                        _.forEach(dvm.characteristics, (obj, key) => {
                            obj.checked = _.includes(_.get(dvm.os.selected, '@type', []), obj.typeIRI);
                        });
                    }

                    setVariables();

                    $scope.$watch('dvm.os.selected', setVariables);
                }]
            }
        }
})();
