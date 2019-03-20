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
     * @name discover.component:datasetSelect
     *
     * @description
     * HTML contents in the dataset select which provides a dropdown select of all datasets with a
     * clear button.
     * 
     * @param {string} bindModel The IRI of the dataset record
     * @param {Function} changeEvent A function to be called when the value of the {@link discover.component:datasetSelect datasetSelect}
     * changes. Expects an argument called `value` and should update the value of `bindModel`.
     * @param {Function} onSelect A function to be called when a new dataset is selected
     */
    const datasetFormGroupComponent = {
        templateUrl: 'discover/components/datasetFormGroup/datasetFormGroup.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            onSelect: '&?'
        },
        controllerAs: 'dvm',
        controller: datasetFormGroupComponentCtrl
    };

    function datasetFormGroupComponentCtrl() {
        var dvm = this;

        dvm.clear = function() {
            dvm.bindModel = '';
            dvm.changeEvent({value: dvm.bindModel});
        }
    }

    angular.module('discover')
        .component('datasetFormGroup', datasetFormGroupComponent);
})();