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
        .module('ontologyPreview', ['prefixes', 'ontologyManager'])
        .directive('ontologyPreview', ontologyPreview);

        ontologyPreview.$inject = ['prefixes', 'ontologyManagerService'];

        function ontologyPreview(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.numClassPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.ontology);
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.ontology, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    dvm.getImports = function() {
                        return _.map(_.get(dvm.ontology, "['" + prefixes.owl + "imports']", []), '@id');
                    }
                    dvm.getClasses = function() {
                        return ontologyManagerService.getClasses(dvm.ontology);
                    }
                    dvm.getClassList = function() {
                        var classes = dvm.getClasses();
                        if (!dvm.full) {
                            classes = _.take(classes, dvm.numClassPreview);
                        }
                        return _.map(classes, function(classObj) {
                            return ontologyManagerService.getEntityName(classObj);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
