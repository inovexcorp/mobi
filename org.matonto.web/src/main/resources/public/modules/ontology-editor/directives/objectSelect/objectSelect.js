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
        .module('objectSelect', ['ontologyManager', 'responseObj', 'settingsManager', 'stateManager', 'prefixes'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj', 'settingsManagerService', 'stateManagerService', 'prefixes'];

        function objectSelect(ontologyManagerService, responseObj, settingsManagerService, stateManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                scope: {
                    displayText: '=',
                    selectList: '=',
                    mutedText: '=',
                    isDisabledWhen: '=',
                    onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return _.get(item, 'ontologyIri', _.get(dvm.sm.ontology, '@id', dvm.sm.ontology.matonto.id));
                    }

                    dvm.getItemIri = function(item) {
                        return _.get(item, '@id', responseObj.getItemIri(item));
                    }

                    dvm.getTooltipDisplay = function(item) {
                        var itemIri = dvm.getItemIri(item);
                        var ontologyIndex = dvm.sm.state.oi;
                        var selectedObject = dvm.om.getObjectCopyByIri(itemIri, ontologyIndex);
                        var result = itemIri;

                        if(dvm.tooltipDisplay === 'comment') {
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(selectedObject, "['" + prefixes.dcterms + "description'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "description'][0]['@value']", itemIri)));
                        } else if(dvm.tooltipDisplay === 'label') {
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "label'][0]['@value']", _.get(selectedObject, "['" + prefixes.dcterms + "title'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "title'][0]['@value']", itemIri)));
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
                            var propertyIRI = _.get(dvm.sm.ontology.matonto.propertyExpressions, id);
                            var classIRI = _.get(dvm.sm.ontology.matonto.classExpressions, id);
                            var unionOfIRI = _.get(dvm.sm.ontology.matonto.unionOfs, id);
                            var intersectionOfIRI = _.get(dvm.sm.ontology.matonto.intersectionOfs, id);

                            result = propertyIRI || classIRI || unionOfIRI || intersectionOfIRI || id;
                        }

                        return result;
                    }
                }
            }
        }
})();
