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
        .module('createPropertyOverlay', ['camelCase', 'ontologyManager'])
        .directive('createPropertyOverlay', createPropertyOverlay);

        function createPropertyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                scope: {
                    onCreate: '&',
                    onCancel: '&',
                    createPropertyError: '=',
                    showIriOverlay: '=',
                    ontologyId: '@',
                    matonto: '='
                },
                bindToController: {
                    iriBegin: '=',
                    iriThen: '=',
                    propertyTypes: '=',
                    subClasses: '=',
                    propertyRange: '='
                },
                controllerAs: 'dvm',
                controller: ['$filter', 'REGEX', 'ontologyManagerService', function($filter, REGEX, ontologyManagerService) {
                    var dvm = this;
                    var prefix = dvm.iriBegin + dvm.iriThen;
                    var setAsObject = false;
                    var setAsDatatype = false;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iri = prefix;
                    dvm.range = [];
                    dvm.domain = [];

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.iri = iriBegin + iriThen + iriEnd;
                    }

                    dvm.setRange = function() {
                        var isObjectProperty = ontologyManagerService.isObjectProperty(dvm.type);
                        if(isObjectProperty && !setAsObject) {
                            dvm.rangeList = dvm.subClasses;
                            dvm.range = [];
                            setAsObject = true;
                            setAsDatatype = false;
                        } else if(!isObjectProperty && !setAsDatatype) {
                            dvm.rangeList = dvm.propertyRange;
                            dvm.range = [];
                            setAsObject = false;
                            setAsDatatype = true;
                        }
                    }
                }]
            }
        }
})();
