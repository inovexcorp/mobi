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
         * @name iriTemplateOverlay
         *
         * @description
         * The `iriTemplateOverlay` module only provides the `iriTemplateOverlay` component which creates content for a
         * modal to edit the IRI template of a class mapping.
         */
        .module('iriTemplateOverlay', [])
        /**
         * @ngdoc component
         * @name iriTemplateOverlay.component:iriTemplateOverlay
         * @requires shared.service:prefixes
         * @requires shared.service:mappingManagerService
         * @requires shared.service:mapperStateService
         * @requires shared.service:delimitedManagerService
         * @requires shared.service:utilService
         *
         * @description
         * `iriTemplateOverlay` is a component that creates content for a modal that changes the IRI template of the
         * {@link shared.service:mapperStateService selected class mapping}. The modal splits the IRI template
         * into the beginning of the namespace, the delimiter between the namespace and local name, and the dynamically
         * created local name. The local name can either be a UUID or a column header. Meant to be used in conjunction
         * with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('iriTemplateOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['prefixes', 'utilService', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService', IriTemplateOverlayController],
            templateUrl: 'mapper/directives/iriTemplateOverlay/iriTemplateOverlay.component.html'
        });

        function IriTemplateOverlayController(prefixes, utilService, mapperStateService, mappingManagerService, delimitedManagerService) {
            var dvm = this;
            dvm.mm = mappingManagerService;
            dvm.state = mapperStateService;
            dvm.dm = delimitedManagerService;
            dvm.util = utilService;

            var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
            var prefix = dvm.util.getPropertyValue(classMapping, prefixes.delim + 'hasPrefix');
            dvm.beginsWith = prefix.slice(0, -1);
            dvm.then = prefix[prefix.length - 1];
            dvm.localNameOptions = [{text: 'UUID', value: '${UUID}'}];
            for (var idx = 0; idx < dvm.dm.dataRows[0].length; idx++) {
                dvm.localNameOptions.push({text: dvm.dm.getHeader(idx), value: '${' + idx + '}'});
            };
            var selectedIndex = _.findIndex(dvm.localNameOptions, {'value': dvm.util.getPropertyValue(classMapping, prefixes.delim + 'localName')});
            dvm.endsWith = selectedIndex > 0 ? dvm.localNameOptions[selectedIndex] : dvm.localNameOptions[_.findIndex(dvm.localNameOptions, {'text': 'UUID'})];

            dvm.set = function() {
                var originalClassMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                var originalPrefix = dvm.util.getPropertyValue(originalClassMapping, prefixes.delim + 'hasPrefix');
                var originalLocalName = dvm.util.getPropertyValue(originalClassMapping, prefixes.delim + 'localName');
                dvm.mm.editIriTemplate(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId, dvm.beginsWith + dvm.then, dvm.endsWith.value);
                dvm.state.changeProp(dvm.state.selectedClassMappingId, prefixes.delim + 'hasPrefix', dvm.beginsWith + dvm.then, originalPrefix);
                dvm.state.changeProp(dvm.state.selectedClassMappingId, prefixes.delim + 'localName', dvm.endsWith.value, originalLocalName);
                dvm.close();
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }
        }
})();
