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
        .module('objectSelect', ['ontologyManager', 'responseObj', 'settingsManager', 'stateManager'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj', 'settingsManagerService', 'stateManagerService'];

        function objectSelect(ontologyManagerService, responseObj, settingsManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                scope: {
                    changeEvent: '&',
                    displayText: '=',
                    selectList: '=',
                    mutedText: '=',
                    isDisabledWhen: '='
                },
                bindToController: {
                    bindModel: '=ngModel',
                    selectedId: '=',
                    ontologyId: '@',
                    matonto: '='
                },
                controllerAs: 'dvm',
                controller: ['prefixes', function(prefixes) {
                    var dvm = this;

                    dvm.tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return _.get(item, 'ontologyIri', dvm.ontologyId);
                    }

                    dvm.getItemIri = function(item) {
                        return _.get(item, '@id', responseObj.getItemIri(item));
                    }

                    dvm.getTooltipDisplay = function(item) {
                        var itemIri = dvm.getItemIri(item);
                        var ontologyIndex = _.get(stateManagerService.getState(), 'oi');
                        var selectedObject = ontologyManagerService.getObjectCopyByIri(itemIri, ontologyIndex);
                        var result = itemIri;

                        if(dvm.tooltipDisplay === 'comment') {
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "description'][0]['@value']", itemIri));
                        } else if(dvm.tooltipDisplay === 'label') {
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "label'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "title'][0]['@value']", itemIri));
                        } else if(_.has(selectedObject, '@id')) {
                            result = selectedObject['@id'];
                        }

                        return result;
                    }

                    dvm.isBlankNode = function(id) {
                        return typeof id === 'string' && _.includes(id, '_:b');
                    }

                    dvm.getBlankNodeValue = function(id) {
                        var result;

                        if(dvm.isBlankNode(id)) {
                            var propertyIRI = _.get(dvm.matonto.propertyExpressions, id);
                            var classIRI = _.get(dvm.matonto.classExpressions, id);
                            var unionOfIRI = _.get(dvm.matonto.unionOfs, id);
                            var intersectionOfIRI = _.get(dvm.matonto.intersectionOfs, id);

                            result = propertyIRI || classIRI || unionOfIRI || intersectionOfIRI || id;
                        }

                        return result;
                    }
                }]
            }
        }
})();
