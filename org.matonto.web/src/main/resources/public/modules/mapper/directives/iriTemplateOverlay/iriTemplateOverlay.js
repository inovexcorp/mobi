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
         * @name iriTemplateOverlay
         *
         * @description
         * The `iriTemplateOverlay` module only provides the `iriTemplateOverlay` directive which creates
         * an overlay with functionality to change the IRI template of the selected class mapping.
         */
        .module('iriTemplateOverlay', [])
        /**
         * @ngdoc directive
         * @name iriTemplateOverlay.directive:iriTemplateOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description
         * `iriTemplateOverlay` is a directive that creates an overlay with functionality to change the
         * IRI template of the selected class mapping. The overlay splits the IRI template into part of
         * the namespace, the delimiter between the namespace and local name, and the dynamically created
         * local name. The local name can either be a UUID or a column header. The directive is replaced
         * by the contents of its template.
         */
        .directive('iriTemplateOverlay', iriTemplateOverlay);

        iriTemplateOverlay.$inject = ['prefixes', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function iriTemplateOverlay(prefixes, mapperStateService, mappingManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.mm = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;

                    var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                    var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                    var regex = new RegExp(prefixes.data + '(.*?)\/');
                    var prefixEnd = prefix.replace(regex, '');
                    dvm.beginning = _.pullAt(prefix.match(regex), 0)[0];
                    dvm.beginsWith = prefixEnd.slice(0, -1);
                    dvm.then = prefixEnd[prefixEnd.length - 1];
                    dvm.localNameOptions = [{text: 'UUID', value: '${UUID}'}];
                    for (var idx = 0; idx < dvm.dm.dataRows[0].length; idx++) {
                        dvm.localNameOptions.push({text: dvm.dm.getHeader(idx), value: '${' + idx + '}'});
                    };
                    var selectedIndex = _.findIndex(dvm.localNameOptions, {'value': _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']")});
                    dvm.endsWith = selectedIndex > 0 ? dvm.localNameOptions[selectedIndex] : dvm.localNameOptions[_.findIndex(dvm.localNameOptions, {'text': 'UUID'})];

                    dvm.set = function() {
                        dvm.mm.editIriTemplate(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId, dvm.beginsWith + dvm.then, dvm.endsWith.value);
                    }
                },
                templateUrl: 'modules/mapper/directives/iriTemplateOverlay/iriTemplateOverlay.html'
            }
        }
})();
