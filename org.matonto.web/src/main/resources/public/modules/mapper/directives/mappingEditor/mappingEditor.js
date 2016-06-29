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
         * @name mappingEditor
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `mappingEditor` module only provides the `mappingEditor` directive which creates
         * the main editor for mappings and mapping data.
         */
        .module('mappingEditor', ['mappingManager', 'mapperState', 'ontologyManager', 'csvManager'])
        /**
         * @ngdoc directive
         * @name mappingEditor.directive:mappingEditor
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `mappingEditor` is a directive that creates a div with three main sections: the header area
         * with functionalities like editing the mapping name, the main editor area with forms to add 
         * and edit entities in the mapping, and the file preview table. The header contains a section 
         * for previewing the selected source ontology for the mapping and changing that source ontology,
         * displaying and editing the mapping name, and submiting or canceling the mapping process. The 
         * main editor area contains a pull out for previewing the mapped data, the list of class mappings 
         * and their property mappings in the mapping, and form for editing class and property mappings 
         * and adding new property mappings. The directive is replaced by the contents of its template.
         */
        .directive('mappingEditor', mappingEditor);

        mappingEditor.$inject = ['$q', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService', 'csvManagerService'];

        function mappingEditor($q, mappingManagerService, mapperStateService, ontologyManagerService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.cm = csvManagerService;

                    dvm.getSourceOntologyName = function() {
                        return dvm.om.getEntityName(dvm.mm.getSourceOntology(_.get(dvm.mm.mapping, 'jsonld')));
                    }
                    dvm.changeOntology = function() {
                        dvm.state.changeOntology = true;
                        dvm.state.cacheSourceOntologies();
                        dvm.state.step = dvm.state.ontologySelectStep;
                    }
                    dvm.submit = function() {
                        var deferred = $q.defer();
                        if (_.includes(dvm.mm.previousMappingNames, dvm.mm.mapping.name)) {
                            deferred.resolve();
                        } else {
                            dvm.mm.uploadPut(dvm.mm.mapping.jsonld, dvm.mm.mapping.name)
                                .then(() => deferred.resolve(), errorMessage => deferred.reject(errorMessage));
                        }
                        deferred.promise.then(() => {
                            dvm.cm.map(dvm.mm.mapping.name);
                            dvm.state.resetEdit();
                            dvm.state.step = dvm.state.finishStep;
                            dvm.saveError = false;
                        }, errorMessage => {
                            dvm.saveError = true;
                        });
                        
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingEditor/mappingEditor.html'
            }
        }
})();
