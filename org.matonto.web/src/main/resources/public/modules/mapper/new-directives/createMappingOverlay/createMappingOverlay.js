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
        .module('createMappingOverlay', [])
        .directive('createMappingOverlay', createMappingOverlay);

        createMappingOverlay.$inject = ['$q', 'mappingManagerService', 'mapperStateService']

        function createMappingOverlay($q, mappingManagerService, mapperStateService) {
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
                    dvm.errorMessage = ''
                    dvm.savedMappingName = _.get(dvm.mm.previousMappingNames, 0, '');

                    dvm.cancel = function() {
                        dvm.state.editMapping = false;
                        dvm.state.newMapping = false;
                        dvm.mm.mapping = undefined;
                        dvm.state.displayCreateMapping = false;
                    }
                    dvm.continue = function() {
                        var deferred = $q.defer();
                        if (dvm.mappingType === 'new') {
                            deferred.resolve(dvm.mm.createNewMapping());
                        } else {
                            dvm.mm.getMapping(dvm.savedMappingName).then(mapping => {
                                deferred.resolve(dvm.mm.copyMapping(mapping));
                            }, error => {
                                dvm.reject(error);
                            });
                        }

                        deferred.promise.then(mapping => {
                            dvm.state.mappingSearchString = '';
                            dvm.mm.mapping.jsonld = mapping;
                            dvm.state.step = dvm.state.fileUploadStep;
                            dvm.state.displayCreateMapping = false;
                        }, error => {
                            dvm.errorMessage = error;
                        });
                    }
                },
                templateUrl: 'modules/mapper/new-directives/createMappingOverlay/createMappingOverlay.html'
            }
        }
})();
