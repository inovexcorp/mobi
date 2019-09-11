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
import { get, isUndefined } from 'lodash';

const template = require('./iriSelectOntology.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:iriSelectOntology
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 *
 * @description
 * `objectPropertyOverlay` is a component that creates a `ui-select` for select a specific IRI from the provided
 * `selectList`. The value of the `ui-select` is bound to `bindModel`, but only one way. The provided `changeEvent`
 * function is expected to update the value of `bindModel`. Can optionally specify whether the `ui-select` binds
 * one or more values, when it should be required, and when it should be disabled. Can also provide display and
 * muted text for a label for the select.
 *
 * @param {*} bindModel The variable to bind the selected IRIs to. Either an array of strings or a single one
 * @param {string[]} selectList The list of IRI strings to select from
 * @param {string} [displayText=''] An optional display name for the `ui-select`
 * @param {string} [mutedText=''] An optional string of text to display muted next to the label
 * @param {boolean} [isDisabledWhen=false] An optional expression denoting when the `ui-select` should be disabled
 * @param {boolean} [isRequiredWhen=false] An optional expression denoting when the `ui-select` should be required
 * @param {boolean} [multiSelect=true] Whether the `ui-select` should bind multiple values
 * @param {Function} changeEvent A function that will be called when the value of the `ui-select` changes. Should
 * update the value of `bindModel`. Expects an argument called `values`.
 */
const iriSelectOntologyComponent = {
    template,
    bindings: {
        bindModel: '<',
        selectList: '<',
        displayText: '<',
        mutedText: '<',
        isDisabledWhen: '<',
        isRequiredWhen: '<',
        multiSelect: '<?',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: iriSelectOntologyComponentCtrl
};

iriSelectOntologyComponentCtrl.$inject = ['ontologyStateService', 'ontologyUtilsManagerService'];

function iriSelectOntologyComponentCtrl(ontologyStateService, ontologyUtilsManagerService) {
    var dvm = this;
    var os = ontologyStateService;

    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.values = [];

    dvm.$onChanges = function() {
        dvm.isMultiSelect = !isUndefined(dvm.multiSelect) ? dvm.multiSelect : true;
    }
    dvm.onChange = function() {
        dvm.changeEvent({value: dvm.bindModel});
    }
    dvm.getOntologyIri = function(iri) {
        return get(dvm.selectList, "['" + iri + "']", os.listItem.ontologyId);
    }
    dvm.getValues = function(searchText) {
        dvm.values = dvm.ontoUtils.getSelectList(Object.keys(dvm.selectList), searchText, dvm.ontoUtils.getDropDownText);
    }
}

export default iriSelectOntologyComponent;