/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name instanceEditor
         *
         * @description
         * The `instanceEditor` module only provides the `instanceEditor` directive which creates
         * the instance editor page.
         */
        .module('instanceEditor', [])
        /**
         * @ngdoc directive
         * @name instanceEditor.directive:instanceEditor
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the selected instance in an editable format.
         */
        .directive('instanceEditor', instanceEditor);
        
        instanceEditor.$inject = ['discoverStateService'];

        function instanceEditor(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceEditor/instanceEditor.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                    dvm.entity = _.omit(dvm.ds.explore.instance.entity, ['@id', '@type']);
                }
            }
        }
})();