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

    /**
     * @ngdoc component
     * @name mapper.component:classMappingSelect
     * @requires shared.service:utilService
     *
     * @description
     * `classMappingSelect` is a component that creates a div with `ui-select` containing all the ClassMappings
     * in the passed list. The value of the `ui-select` will be the id of the selected ClassMapping and is bound to
     * `bindModel`, but only one way. The provided `changeEvent` function is expected to update the value of
     * `bindModel`. will be the id of the selected ClassMapping.
     *
     * @param {string} bindModel The id of the selected ClassMapping.
     * @param {Object[]} classMappings A list of ClassMapping JSON-LD objects
     * @param {Function} changeEvent The function to be called when the selected ClassMapping changes. Should update the
     * value of `bindModel`. Expects an argument called `value`.
     */
    const classMappingSelectComponent = {
        templateUrl: 'mapper/components/classMappingSelect/classMappingSelect.component.html',
        bindings: {
            bindModel: '<',
            classMappings: '<',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: classMappingSelectComponentCtrl
    };

    classMappingSelectComponentCtrl.$inject = ['utilService'];

    function classMappingSelectComponentCtrl(utilService) {
        var dvm = this;
        dvm.util = utilService;

        dvm.getTitle = function(classMapping) {
            return dvm.util.getDctermsValue(classMapping, 'title');
        }
    }

    angular.module('mapper')
        .component('classMappingSelect', classMappingSelectComponent);
})();
