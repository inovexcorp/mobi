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
        .module('iriTemplateOverlay', ['prefixes'])
        .directive('iriTemplateOverlay', iriTemplateOverlay);

        iriTemplateOverlay.$inject = ['prefixes'];

        function iriTemplateOverlay(prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    cancel: '&',
                    set: '&'
                },
                bindToController: {
                    columns: '=',
                    classMapping: '='
                },
                controller: function() {
                    var dvm = this;
                    var prefix = _.get(dvm.classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                    var regex = new RegExp(prefixes.data + '(.*?)\/');
                    var prefixEnd = prefix.replace(regex, '');
                    dvm.beginning = _.pullAt(prefix.match(regex), 0)[0];
                    dvm.beginsWith = prefixEnd.slice(0, -1);
                    dvm.then = prefixEnd[prefixEnd.length - 1];
                    dvm.localNameOptions = [{text: 'UUID', value: '${UUID}'}];
                    _.forEach(dvm.columns, function(column, idx) {
                        dvm.localNameOptions.push({text: column, value: '${' + idx + '}'});
                    });
                    var selectedIndex = _.findIndex(dvm.localNameOptions, {'value': _.get(dvm.classMapping, "['" + prefixes.delim + "localName'][0]['@value']")});
                    dvm.endsWith = selectedIndex > 0 ? dvm.localNameOptions[selectedIndex] : dvm.localNameOptions[_.findIndex(dvm.localNameOptions, {'text': 'UUID'})];
                },
                templateUrl: 'modules/mapper/directives/iriTemplateOverlay/iriTemplateOverlay.html'
            }
        }
})();
