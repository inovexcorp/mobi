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
     * @name ontology-editor.component:ontologyClassSelect
     * @requires shared.service:ontologyStateService
     * @requires shared.service:utilService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `ontologyClassSelect` is a component that creates a Bootstrap `form-group` with a `ui-select` of the IRIs of
     * all the classes in the current {@link shared.service:ontologyStateService selected ontology} and its
     * imports. The value of the select is bound to `bindModel`, but only one way. The provided `changeEvent`
     * function is expected to update the value of `bindModel`.
     *
     * @param {Object[]} bindModel The variable to bind the selected class IRIs to
     * @param {Function} changeEvent A function that will be called when the value of the `ui-select` changes. Should
     * update the value of `bindModel`. Expects an argument called `values`.
     * @param {Function} lockChoice An optional expression to determine whether a selected class should be locked
     */
    const ontologyClassSelectComponent = {
        templateUrl: 'ontology-editor/components/ontologyClassSelect/ontologyClassSelect.component.html',
        bindings: {
            bindModel: '<',
            lockChoice: '&',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: ontologyClassSelectComponentCtrl
    };

    ontologyClassSelectComponentCtrl.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

    function ontologyClassSelectComponentCtrl(ontologyStateService, utilService, ontologyUtilsManagerService) {
        var dvm = this;
        var os = ontologyStateService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.util = utilService;
        dvm.array = [];

        dvm.getValues = function(searchText) {
            dvm.array =  dvm.ontoUtils.getSelectList(_.keys(os.listItem.classes.iris), searchText, dvm.ontoUtils.getDropDownText);
        }
        dvm.onChange = function() {
            dvm.changeEvent({values: dvm.bindModel});
        }
    }

    angular.module('ontology-editor')
        .component('ontologyClassSelect', ontologyClassSelectComponent);
})();