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
     * @name ontology-editor.component:propertyValues
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:ontologyManagerService
     *
     * @description
     * `propertyValues` is a component that creates a display of the values of the provided `property` on the provided
     * JSON-LD `entity`. Display includes the property as a header and the individual values displayed using either
     * a {@link ontology-editor.component:blankNodeValueDisplay} or {@link shared.component:valueDisplay}. Each value
     * can optionally have a edit and remove button depending on whether functions for those actions are provided. The
     * values can also optionally be highlighted according to the provided `highlightText` and their property headers if
     * included in the provided `highlightIris` list.
     *
     * @param {string} property The ID of a property on the `entity`
     * @param {Object} entity A JSON-LD object
     * @param {Function} edit An optional function for editing a property value. Expects an argument called iri for the
     * property ID and an argument called index for the value's index in the property array
     * @param {Function} remove An optional function for removing a property value. Expects an argument called iri for
     * the property ID and an argument called index for the value's index in the property array
     * @param {string[]} highlightIris An optional array of property IRIs that should be highlighted
     * @param {string} highlightText An optional string that should be highlighted in any value displays
     */
    const propertyValuesComponent = {
        templateUrl: 'ontology-editor/components/propertyValues/propertyValues.component.html',
        bindings: {
            property: '<',
            entity: '<',
            edit: '&?',
            remove: '&?',
            highlightIris: '<',
            highlightText: '<'
        },
        controllerAs: 'dvm',
        controller: propertyValuesComponentCtrl
    };

    propertyValuesComponentCtrl.$inject = ['ontologyUtilsManagerService', 'ontologyStateService', 'ontologyManagerService'];

    function propertyValuesComponentCtrl(ontologyUtilsManagerService, ontologyStateService, ontologyManagerService) {
        var dvm = this;
        dvm.om = ontologyManagerService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.os = ontologyStateService;

        dvm.valueInList = function() {
            return _.includes(dvm.highlightIris, dvm.property);
        }
    }

    angular.module('ontology-editor')
        .component('propertyValues', propertyValuesComponent);
})();
