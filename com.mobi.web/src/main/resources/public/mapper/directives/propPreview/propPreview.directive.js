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
        /**
         * @ngdoc overview
         * @name propPreview
         *
         * @description
         * The `propPreview` module only provides the `propPreview` directive which creates
         * a brief description of the passed property and its range.
         */
        .module('propPreview', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name propPreview.directive:propPreview
         * @scope
         * @restrict E
         * @requires $filter
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `propPreview` is a directive that creates a div with a brief description of the passed
         * property and its range. It displays the name of the property, its IRI, its description, and
         * its range datatype or class. The directive is replaced by the contents of its template.
         *
         * @param {Object} propObj the property object from an ontology to preview
         * @param {Object[]} ontologies A list of ontologies containing the property and to pull the
         * range class from
         */
        .directive('propPreview', propPreview);

        propPreview.$inject = ['$filter', 'ontologyManagerService', 'mapperStateService', 'utilService', 'prefixes'];

        function propPreview($filter, ontologyManagerService, mapperStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    propObj: '<',
                    ontologies: '<'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var util = utilService;
                    var state = mapperStateService;
                    dvm.om = ontologyManagerService;
                    dvm.rangeClass = undefined;

                    dvm.getPropRangeName = function() {
                        if (dvm.om.isObjectProperty(dvm.propObj)) {
                            return dvm.om.getEntityName(dvm.rangeClass);
                        } else {
                            return $filter('splitIRI')(util.getPropertyId(dvm.propObj, prefixes.rdfs + 'range')).end || 'string';
                        }
                    }

                    $scope.$watch('dvm.propObj', function(newValue, oldValue) {
                        if (dvm.om.isObjectProperty(newValue)) {
                            var rangeClassId = util.getPropertyId(newValue, prefixes.rdfs + 'range');
                            if (rangeClassId !== _.get(dvm.rangeClass, '@id')) {
                                var availableClass = _.find(state.availableClasses, {classObj: {'@id': rangeClassId}});
                                dvm.rangeClass = availableClass.classObj;
                            }
                        } else {
                            dvm.rangeClass = undefined;
                        }
                    });
                }],
                templateUrl: 'mapper/directives/propPreview/propPreview.directive.html'
            }
        }
})();
