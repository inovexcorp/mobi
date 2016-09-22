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
         * @name createMappingOverlay
         *
         * @description 
         * The `createMappingOverlay` module only provides the `createMappingOverlay` directive which creates
         * an overlay with functionality to create a new mapping two different ways.
         */
        .module('createMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name createMappingOverlay.directive:createMappingOverlay
         * @scope
         * @restrict E
         * @requires  $q
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `createMappingOverlay` is a directive that creates an overlay with functionality to create a  
         * new mapping either from scratch, or using a saved mapping as a template. The new mapping name
         * set in the {@link mappingNameInput.directive:mappingNameInput mappingNameInput} must be unique. 
         * The directive is replaced by the contents of its template.
         */
        .directive('createMappingOverlay', createMappingOverlay);

        createMappingOverlay.$inject = ['$q', '$filter', 'mappingManagerService', 'mapperStateService']

        function createMappingOverlay($q, $filter, mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.mappingType = 'new';
                    dvm.errorMessage = '';
                    dvm.newName = $filter('splitIRI')(_.get(dvm.mm.mapping, 'id', '')).end;
                    dvm.savedMappingId = _.get(dvm.mm.mappingIds, '0', '');

                    dvm.cancel = function() {
                        dvm.state.editMapping = false;
                        dvm.state.newMapping = false;
                        dvm.mm.mapping = undefined;
                        dvm.state.displayCreateMapping = false;
                        dvm.mm.sourceOntologies = [];
                    }
                    dvm.continue = function() {
                        var deferred = $q.defer();
                        dvm.mm.mapping.id = dvm.mm.getMappingId(dvm.newName);
                        if (dvm.mappingType === 'new') {
                            deferred.resolve(dvm.mm.createNewMapping(dvm.mm.mapping.id));
                        } else {
                            dvm.mm.getMapping(dvm.savedMappingId).then(mapping => {
                                deferred.resolve(dvm.mm.copyMapping(mapping, dvm.mm.mapping.id));
                            }, error => {
                                deferred.reject(error);
                            });
                        }

                        deferred.promise.then(mapping => {
                            dvm.mm.mapping.jsonld = mapping;
                            return dvm.mm.setSourceOntologies(dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld));
                        }, error => $q.reject(error)).then(() => {
                            if (dvm.mm.areCompatible()) {
                                dvm.state.mappingSearchString = '';
                                dvm.state.step = dvm.state.fileUploadStep;
                                dvm.state.displayCreateMapping = false;                             
                            } else {
                                onError('The selected mapping is incompatible with its source ontologies.');
                            }
                        }, onError);
                    }

                    function onError(message) {
                        dvm.errorMessage = message;
                        dvm.mm.mapping.jsonld = [];
                    }
                },
                templateUrl: 'modules/mapper/directives/createMappingOverlay/createMappingOverlay.html'
            }
        }
})();
