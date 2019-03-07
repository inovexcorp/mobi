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
         * @name classMappingOverlay
         *
         * @description
         * The `classMappingOverlay` module only provides the `classMappingOverlay` component which creates
         * creates content for a modal to add a ClassMapping to a mapping.
         */
        .module('classMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name classMappingOverlay.component:classMappingOverlay
         * @requires shared.service:mappingManagerService
         * @requires shared.service:mapperStateService
         *
         * @description
         * `classMappingOverlay` is a component that creates content for a modal that creates a ClassMapping in the
         * current {@link shared.service:mapperStateService#mapping mapping} and a preview of
         * the selected class. Meant to be used in conjunction with the {@link shared.service:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('classMappingOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['mapperStateService', 'mappingManagerService', ClassMappingOverlayController],
            templateUrl: 'mapper/directives/classMappingOverlay/classMappingOverlay.component.html'
        });

        function ClassMappingOverlayController(mapperStateService, mappingManagerService) {
            var dvm = this;
            var mm = mappingManagerService;
            dvm.state = mapperStateService;
            dvm.selectedClass = undefined;

            dvm.addClass = function() {
                var classMapping = dvm.state.addClassMapping(dvm.selectedClass);
                if (!dvm.state.hasPropsSet(dvm.selectedClass.classObj['@id'])) {
                    dvm.state.setProps(dvm.selectedClass.classObj['@id']);
                }
                dvm.state.resetEdit();
                dvm.state.selectedClassMappingId = classMapping['@id'];
                dvm.close();
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }
        }
})();
