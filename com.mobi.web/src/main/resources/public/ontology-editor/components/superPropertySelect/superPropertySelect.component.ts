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

const template = require('./superPropertySelect.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:superPropertySelect
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 *
 * @description
 * `superPropertySelect` is a component which provides a link to hide/show a `ui-select` of all available properties
 * IRIs in the currently {@link shared.service:ontologyStateService selected ontology} in the list identified by the
 * provided key. The value of the select is bound to `bindModel`, but only one way. The provided `changeEvent`
 * function is expected to update the value of `bindModel`.
 * 
 * @param {string} key The key to a list on the currently selected ontology
 * @param {Object[]} bindModel The variable to bind the selected properties to in the form of `{'@id': propIRI}`
 * @param {Function} changeEvent A function that will be called when the value of the `ui-select` changes. Should
 * update the value of `bindModel`. Expects an argument called `values`.
 */
const superPropertySelectComponent = {
    template,
    bindings: {
        key: '<',
        bindModel: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: superPropertySelectComponentCtrl
};

superPropertySelectComponentCtrl.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

function superPropertySelectComponentCtrl(ontologyStateService, utilService, ontologyUtilsManagerService) {
    var dvm = this;
    var os = ontologyStateService;
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.util = utilService;
    dvm.isShown = false;
    dvm.array = [];

    dvm.show = function() {
        dvm.isShown = true;
    }
    dvm.hide = function() {
        dvm.isShown = false;
        dvm.changeEvent({values: []});
    }
    dvm.onChange = function() {
        dvm.changeEvent({values: dvm.bindModel});
    }
    dvm.getValues = function(searchText) {
        dvm.array =  dvm.ontoUtils.getSelectList(Object.keys(os.listItem[dvm.key].iris), searchText, dvm.ontoUtils.getDropDownText);
    }
}

export default superPropertySelectComponent;