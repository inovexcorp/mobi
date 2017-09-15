/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name classAndPropertyBlock
         *
         * @description
         * The `classAndPropertyBlock` module only provides the `classAndPropertyBlock` directive which creates
         * the class and property block within the analytics page.
         */
        .module('classAndPropertyBlock', [])
        /**
         * @ngdoc directive
         * @name classAndPropertyBlock.directive:classAndPropertyBlock
         * @scope
         * @restrict E
         * @requires $q
         * @requires analyticState.service:analyticStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the class and property block which contain class and property lists to be dragged
         * out onto the editor section to create an analytic.
         */
        .directive('classAndPropertyBlock', classAndPropertyBlock);
        
        classAndPropertyBlock.$inject = ['$q', 'analyticStateService', 'ontologyManagerService', 'prefixes', 'utilService'];
        
        function classAndPropertyBlock($q, analyticStateService, ontologyManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/classAndPropertyBlock/classAndPropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var util = utilService;
                    dvm.state = analyticStateService;
                    
                    if (!dvm.state.classes.length && !dvm.state.properties.length) {
                        var allOntologies = _.flatten(_.map(dvm.state.datasets, dataset => dataset.ontologies));
                        $q.all(_.map(allOntologies, ontology => om.getOntology(ontology.recordId, ontology.branchId, ontology.commitId)))
                            .then(response => {
                                dvm.state.classes = _.map(om.getClasses(response), clazz => ({
                                    id: clazz['@id'],
                                    title: om.getEntityName(clazz)
                                }));
                                dvm.state.properties = _.map(_.concat(om.getObjectProperties(response), om.getDataTypeProperties(response)), property => ({
                                    id: property['@id'],
                                    title: om.getEntityName(property),
                                    classes: _.has(property, prefixes.rdfs + 'domain') ? _.map(_.get(property, prefixes.rdfs + 'domain'), '@id') : _.map(dvm.state.classes, 'id')
                                }));
                            }, error => util.createErrorToast(util.getErrorMessage(error)));
                    }
                    
                    dvm.isDisabled = function(classes) {
                        return !_.includes(classes, _.get(dvm.state.selectedClass, 'id'));
                    }
                }
            }
        }
})();