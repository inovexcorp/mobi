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
     * @name mapaper.component:mapperSerializationSelect
     *
     * @description
     * `mapperSerializationSelect` is a component which creates a select with the following options for a RDF
     * serialization format: JSON-LD, Turtle, and RDF/XML that is bound to `format`, but only one way. The provided
     * `changeEvent` function is expected to update the value of `format`.
     *
     * @param {string} format A string representing an RDF serialization
     * @param {string} name The optional string name for the select in a form
     * @param {boolean} required Whether the select should be required. The presence of the attribute is enough to set it
     * @param {Function} changeEvent The function to be called when the format changes. Should update the value of
     * `format`. Expects an argument called `value`
     */
    const mapperSerializationSelectComponent = {
        templateUrl: 'mapper/components/mapperSerializationSelect/mapperSerializationSelect.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            format: '<',
            name: '<',
            required: '@',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: mapperSerializationSelectComponentCtrl
    };

    function mapperSerializationSelectComponentCtrl() {
        var dvm = this;
        dvm.options = [
            {
                name: 'JSON-LD',
                value: 'jsonld'
            },
            {
                name: 'Turtle',
                value: 'turtle'
            },
            {
                name: 'RDF/XML',
                value: 'rdf/xml'
            }
        ];
        dvm.isRequired = false;

        dvm.$onInit = function() {
            dvm.isRequired = dvm.required !== undefined;
        }
    }

    angular.module('mapper')
        .component('mapperSerializationSelect', mapperSerializationSelectComponent);
})();
