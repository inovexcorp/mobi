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
        .module('characteristicsBlock', [])
        .directive('characteristicsBlock', characteristicsBlock);

        characteristicsBlock.$inject = ['prefixes', 'ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

        function characteristicsBlock(prefixes, ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/characteristicsBlock/characteristicsBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.characteristics = [
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'FunctionalProperty',
                            displayText: 'Functional Property',
                            objectOnly: false
                        },
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'AsymmetricProperty',
                            displayText: 'Asymmetric Property',
                            objectOnly: true
                        }
                    ];

                    dvm.filter = function(obj) {
                        return !obj.objectOnly || om.isObjectProperty(dvm.os.listItem.selected);
                    }
                    dvm.onChange = function(characteristicObj) {
                        if (characteristicObj.checked) {
                            _.set(dvm.os.listItem.selected, '@type', _.concat(_.get(dvm.os.listItem.selected, '@type', []), characteristicObj.typeIRI));
                            handleCase(dvm.os.listItem.deletions, dvm.os.addToAdditions, characteristicObj.typeIRI);
                        } else {
                            removeTypeFrom(dvm.os.listItem.selected, characteristicObj.typeIRI);
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
                            method(dvm.os.listItem.ontologyRecord.recordId, {
                                '@id': dvm.os.listItem.selected['@id'],
                                '@type': [typeIRI]
                            });
                        }
                    }

                    function removeTypeFrom(object, typeToRemove) {
                        _.remove(_.get(object, '@type', []), type => type === typeToRemove);
                    }

                    function setVariables() {
                        _.forEach(dvm.characteristics, obj => {
                            obj.checked = _.includes(_.get(dvm.os.listItem.selected, '@type', []), obj.typeIRI);
                        });
                    }

                    setVariables();

                    $scope.$watch('dvm.os.listItem.selected', setVariables);
                }]
            }
        }
})();
