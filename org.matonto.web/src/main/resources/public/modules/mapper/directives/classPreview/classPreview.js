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
         * @requires prefixes.service:prefixes
         *
         * @description 
         * `classPreview` is a directive that creates a div with a brief description of the passed 
         * class and its properties. It displays the name of the class and the list of its properties.
         * The directive is replaced by the contents of its template.
         *
         * @param {object} classObj the class object from an ontology to preview
         */
        .directive('classPreview', classPreview);

        classPreview.$inject = ['prefixes', 'ontologyManagerService', 'mapperStateService'];

        function classPreview(prefixes, ontologyManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '=',
                    ontologies: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.state = mapperStateService;
                    dvm.numPropPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return dvm.om.getEntityName(dvm.classObj);
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.classObj, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(dvm.classObj, "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    dvm.getProps = function() {
                        return dvm.state.getClassProps(dvm.ontologies, dvm.classObj['@id']);
                    }
                    dvm.getPropList = function() {
                        var props = dvm.getProps();
                        if (!dvm.full) {
                            props = _.take(props, dvm.numPropPreview);
                        }
                        return _.map(props, prop => dvm.om.getEntityName(prop));
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
