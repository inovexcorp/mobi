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
     * @name shared.component:iriSelect
     * @requires shared.service:utilService
     *
     * @description
     * `iriSelect` is a component which provides options for a formatted `ui-select` that takes in a map of IRI to its
     * parent IRI. `iriSelect` then will group and sort IRIs based on the parent IRI. The value of the `ui-select` is
     * bound to `bindModel`, but only one way. The provided `changeEvent` is expected to update the value of
     * `bindModel`.
     *
     * @param {*} bindModel The variable to bind the value of the select results to
     * @param {Function} changeEvent A function to be called when a choice from the drop down is selected. Should update
     * the value of `bindModel`. Expects an argument called `value`.
     * @param {Object} selectList A map of IRIs to their parent IRI
     * @param {string} displayText The main text to display above the ui-select
     * @param {string} mutedText Additional muted text to display after the displayText
     * @param {boolean} isDisabledWhen A boolean to indicate when to disable the ui-select
     * @param {boolean} isRequiredWhen A boolean to indicate when the ui-select is required
     * @param {boolean} multiSelect A boolean to select whether to use a multiSelect (true) or a single select (false)
     */
    const iriSelectComponent = {
        templateUrl: 'shared/components/iriSelect/iriSelect.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            selectList: '<',
            displayText: '<',
            mutedText: '<',
            isDisabledWhen: '<',
            isRequiredWhen: '<',
            multiSelect: '@'
        },
        controllerAs: 'dvm',
        controller: iriSelectComponentCtrl
    };

    iriSelectComponentCtrl.$inject = ['utilService'];

    function iriSelectComponentCtrl(utilService) {
        var dvm = this;
        dvm.util = utilService;
        dvm.multiSelect = true;
        dvm.values = [];

        dvm.$onInit = function() {
            dvm.isMultiSelect = dvm.multiSelect !== undefined;
        }
        dvm.getOntologyIri = function(iri) {
            return _.get(dvm.selectList, "['" + iri + "']");
        }
        dvm.getValues = function(searchText) {
            dvm.values = [];
            var mapped = _.map( _.keys(dvm.selectList), item => ({
                item,
                name: dvm.util.getBeautifulIRI(item)
            }));
            var sorted = _.sortBy(mapped, item => _.trim(item.name.toUpperCase()));
            _.forEach(sorted, item => {
                if (dvm.values.length == 100) {
                    return;
                } else if (_.includes(item.name.toUpperCase(), searchText.toUpperCase())) {
                    dvm.values.push(item.item);
                }
            });}
    }

    angular.module('shared')
        .component('iriSelect', iriSelectComponent);
})();
