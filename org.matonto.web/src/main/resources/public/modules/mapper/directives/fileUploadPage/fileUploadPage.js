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
        .module('fileUploadPage', [])
        .directive('fileUploadPage', fileUploadPage);

        fileUploadPage.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function fileUploadPage(mapperStateService, mappingManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/mapper/directives/fileUploadPage/fileUploadPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;

                    dvm.cancel = function() {
                    	dvm.state.displayCancelConfirm = true;
                    }
                    dvm.edit = function() {
                        dvm.state.selectedClassMappingId = _.get(dvm.mm.getBaseClass(dvm.mm.mapping.jsonld), '@id', '');
                        _.forEach(dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld), classMapping => dvm.state.setAvailableProps(classMapping['@id']));
                        dvm.state.step = dvm.state.editMappingStep;
                    }
                    dvm.run = function() {
                        dvm.dm.map(dvm.mm.mapping.name);
                        dvm.state.step = dvm.state.selectMappingStep;
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.dm.reset();
                    }
                }
            }
        }
})();
