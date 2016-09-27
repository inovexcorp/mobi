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
         * @name ontologyPreview
         *
         * @description 
         * The `ontologyPreview` module only provides the `ontologyPreview` directive which creates
         * a preview of the pass in ontology with lists of the imported ontologies and classes 
         * defined within the ontology.
         */
        .module('ontologyPreview', [])
        /**
         * @ngdoc directive
         * @name ontologyPreview.directive:ontologyPreview
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `ontologyPreview` is a directive which creates a div with a preview of the passed ontology.
         * It lists out all the directly imported ontologies by IRI. It also renders an expandable 
         * list of all the classes defined within the ontology. The directive is replaced by the 
         * contents of its template.
         *
         * @param {object} ontology an ontology object from the 
         * {@link mappingManager.service:mappingManagerService#sourceOntologies source ontologies} list
         */
        .directive('ontologyPreview', ontologyPreview);

        ontologyPreview.$inject = ['prefixes', 'ontologyManagerService'];

        function ontologyPreview(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontology: '<'
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.numClassPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return dvm.om.getEntityName(dvm.om.getOntologyEntity(_.get(dvm.ontology, 'entities')));
                    }
                    dvm.createDescription = function() {
                        return dvm.om.getEntityDescription(dvm.om.getOntologyEntity(_.get(dvm.ontology, 'entities')));
                    }
                    dvm.getImports = function() {
                        var ontologyEntity = dvm.om.getOntologyEntity(dvm.ontology.entities);
                        return _.map(_.get(ontologyEntity, "['" + prefixes.owl + "imports']", []), '@id');
                    }
                    dvm.getClasses = function() {
                        return dvm.om.getClasses(dvm.ontology.entities);
                    }
                    dvm.getClassList = function() {
                        var classes = dvm.getClasses();
                        if (!dvm.full) {
                            classes = _.take(classes, dvm.numClassPreview);
                        }
                        return _.map(classes, classObj => dvm.om.getEntityName(classObj));
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
