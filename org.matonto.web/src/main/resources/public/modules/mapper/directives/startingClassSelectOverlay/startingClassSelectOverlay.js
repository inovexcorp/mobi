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
         * @name startingClassSelectOverlay
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `startingClassSelectOverlay` module only provides the `startingClassSelectOverlay` 
         * directive which creates and overlay with a ui-select to select a class and a preview
         * area for the selected class.
         */
        .module('startingClassSelectOverlay', ['prefixes', 'ontologyManager', 'mapperState', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name startingClassSelectOverlay.directive:startingClassSelectOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `startingClassSelectOverlay` is a directive that creates an overlay containing a ui-select 
         * with all the classes defined within the select ontology and all the classes defined in its 
         * imported ontology and a {@link classPreview.directive:classPreview classPreview} of the selected class. 
         * The classes in the ui-select are sorted by the ontology they are defined in. The directive 
         * is replaced by the contents of its template.
         */
        .directive('startingClassSelectOverlay', startingClassSelectOverlay);

        startingClassSelectOverlay.$inject = ['prefixes', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function startingClassSelectOverlay(prefixes, ontologyManagerService, mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.state = mapperStateService;

                    dvm.getOntologyId = function(classObj) {
                        return _.get(dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classObj['@id']), '@id', '');
                    }
                    dvm.getClasses = function() {
                        var classes = [];
                        _.forEach(dvm.mm.sourceOntologies, ontology => {
                            classes = _.concat(classes, dvm.om.getClasses(ontology));
                        });
                        return classes;
                    }
                    dvm.continue = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.clearCachedSourceOntologies();
                            var ontologyId = dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld);
                            dvm.mm.mapping.jsonld = dvm.mm.createNewMapping();
                            dvm.mm.mapping.jsonld = dvm.mm.setSourceOntology(dvm.mm.mapping.jsonld, ontologyId);
                            dvm.state.changeOntology = false;
                            dvm.state.changedMapping();
                        }
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, dvm.selectedClass['@id']);
                        dvm.mm.mapping.jsonld = dvm.mm.addClass(dvm.mm.mapping.jsonld, ontology, dvm.selectedClass['@id']);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = _.get(_.find(dvm.mm.mapping.jsonld, {'@type': [prefixes.delim + 'ClassMapping']}), '@id');
                        dvm.state.updateAvailableProps();
                        dvm.state.step = dvm.state.editMappingStep;
                    }
                    dvm.back = function() {
                        dvm.state.step = dvm.state.ontologySelectStep;
                    }

                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
