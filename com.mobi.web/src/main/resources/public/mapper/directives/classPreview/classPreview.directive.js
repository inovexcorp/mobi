/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name classPreview
         *
         * @description
         * The `classPreview` module only provides the `classPreview` directive which creates
         * a brief description of the passed class and its properties.
         */
        .module('classPreview', [])
        /**
         * @ngdoc directive
         * @name classPreview.directive:classPreview
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `classPreview` is a directive that creates a div with a brief description of the passed
         * class and its properties. It displays the name of the class, its IRI, its description, and
         * the list of its properties. The directive is replaced by the contents of its template.
         *
         * @param {Object} classObj the class object from an ontology to preview
         * @param {Object[]} ontologies A list of ontologies containing the class and to pull properties
         * from.
         */
        .directive('classPreview', classPreview);

        classPreview.$inject = ['mapperStateService', 'ontologyManagerService'];

        function classPreview(mapperStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '<',
                    ontologies: '<'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.state = mapperStateService;
                    dvm.props = [];

                    $scope.$watch('dvm.classObj', function(newValue, oldValue) {
                        var props = dvm.state.getClassProps(dvm.ontologies, newValue['@id']);
                        if (!_.isEqual(newValue, oldValue) || dvm.props.length !== props.length) {
                            dvm.props = props;
                        }
                    });
                }],
                templateUrl: 'mapper/directives/classPreview/classPreview.directive.html'
            }
        }
})();
