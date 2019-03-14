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
     * @name propSelect.component:propSelect
     * @requires $filter
     * @requires shared.service:ontologyManagerService
     *
     * @description
     * `propSelect` is a component which creates a `ui-select` with the passed property list and binds the selected
     * property object to `selectedProp`, but only one way. The provided `changeEvent` function is expected to update
     * the value of `selectedProp`. The `ui-select` can optionally be disabled with the provided `isDisabledWhen`.
     *
     * @param {object} selectedProp the currently selected property object
     * @param {Function} changeEvent An function to be called when the selected property is changed. Should update the
     * value of `selectedProp`. Expects an argument called `value`.
     * @param {object[]} props an array of property objects from the
     * {@link shared.service:ontologyManagerService ontologyManagerService}
     * @param {boolean} isDisabledWhen whether or not the select should be disabled
     */
    const propSelectComponent = {
        templateUrl: 'mapper/components/propSelect/propSelect.component.html',
        bindings: {
            selectedProp: '<',
            changeEvent: '&',
            props: '<',
            isDisabledWhen: '<'
        },
        controllerAs: 'dvm',
        controller: propSelectComponentCtrl
    };

    propSelectComponentCtrl.$inject = ['$filter', 'ontologyManagerService'];

    function propSelectComponentCtrl($filter, ontologyManagerService) {
        var dvm = this;
        var om = ontologyManagerService;
        dvm.selectProps = [];

        dvm.getOntologyId = function(prop) {
            return prop.ontologyId || $filter('splitIRI')(prop.propObj['@id']).begin;
        }
        dvm.setProps = function(searchText) {
            var tempProps = angular.copy(dvm.props);
            _.forEach(tempProps, prop => {
                prop.name = om.getEntityName(prop.propObj);
            });
            if (searchText) {
                tempProps = _.filter(tempProps, prop => _.includes(prop.name.toLowerCase(), searchText.toLowerCase()));
            }
            tempProps.sort((prop1, prop2) => prop1.name.localeCompare(prop2.name));
            dvm.selectProps = _.map(tempProps.slice(0, 100), prop => {
                prop.isDeprecated = om.isDeprecated(prop.propObj);
                prop.groupHeader = dvm.getOntologyId(prop);
                return prop;
            });
        }
    }

    angular.module('mapper')
        .component('propSelect', propSelectComponent);
})();
