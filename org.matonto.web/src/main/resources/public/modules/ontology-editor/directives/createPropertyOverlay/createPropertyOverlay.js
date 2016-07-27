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
        .module('createPropertyOverlay', [])
        .directive('createPropertyOverlay', createPropertyOverlay);

        createPropertyOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'stateManagerService'];

        function createPropertyOverlay($filter, REGEX, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var setAsObject = false;
                    var setAsDatatype = false;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.range = [];
                    dvm.domain = [];
                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.prefix = dvm.sm.ontology.matonto.iriBegin + dvm.sm.ontology.matonto.iriThen;
                    dvm.iri = dvm.prefix;
                    dvm.propertyTypes = dvm.om.getPropertyTypes();

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = dvm.prefix + $filter('camelCase')(dvm.name, 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.iri = iriBegin + iriThen + iriEnd;
                    }

                    dvm.setRange = function() {
                        var isObjectProperty = dvm.om.isObjectProperty(dvm.type);
                        if(isObjectProperty && !setAsObject) {
                            dvm.rangeList = dvm.sm.ontology.matonto.subClasses;
                            dvm.range = [];
                            setAsObject = true;
                            setAsDatatype = false;
                        } else if(!isObjectProperty && !setAsDatatype) {
                            dvm.rangeList = dvm.sm.ontology.matonto.dataPropertyRange;
                            dvm.range = [];
                            setAsObject = false;
                            setAsDatatype = true;
                        }
                    }

                    dvm.create = function() {
                        dvm.om.createProperty(dvm.sm.ontology, dvm.iri, dvm.name, dvm.type, dvm.range, dvm.domain, dvm.description)
                            .then(function(classIndex) {
                                dvm.sm.state.ci = classIndex;
                                dvm.error = '';
                                dvm.sm.showCreatePropertyOverlay = false;
                                dvm.sm.setStateToNew(dvm.sm.state, dvm.om.getList(), 'property');
                            }, function(errorMessage) {
                                dvm.error = errorMessage;
                            });
                    }
                }
            }
        }
})();
