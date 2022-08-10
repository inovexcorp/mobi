/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

import './ontologyClassSelect.component.scss';

const template = require('./ontologyClassSelect.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:ontologyClassSelect
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 *
 * @description
 * `ontologyClassSelect` is a component that creates a Bootstrap `form-group` with a `ui-select` of the IRIs of
 * all the classes in the current {@link shared.service:ontologyStateService selected ontology} and its
 * imports. The value of the select is bound to `bindModel`, but only one way. The provided `changeEvent`
 * function is expected to update the value of `bindModel`. Can also optionally provide more IRIs to be included on top
 * of the list of class IRIs
 *
 * @param {Object[]} bindModel The variable to bind the selected class IRIs to
 * @param {string[]} extraOptions Any extra IRIs to be included in the dropdown options
 * @param {Function} changeEvent A function that will be called when the value of the `ui-select` changes. Should
 * update the value of `bindModel`. Expects an argument called `values`.
 * @param {Function} lockChoice An optional expression to determine whether a selected class should be locked
 */
const ontologyClassSelectComponent = {
    template,
    bindings: {
        bindModel: '<',
        extraOptions: '<',
        lockChoice: '&',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: ontologyClassSelectComponentCtrl
};

ontologyClassSelectComponentCtrl.$inject = ['ontologyStateService', 'utilService'];

function ontologyClassSelectComponentCtrl(ontologyStateService: OntologyStateService, utilService) {
    const dvm = this;
    dvm.os = ontologyStateService;
    dvm.util = utilService;
    dvm.array = [];

    dvm.getValues = function(searchText) {
        let iris = Object.keys(dvm.os.listItem.classes.iris);
        if (dvm.extraOptions && dvm.extraOptions.length) {
            iris = iris.concat(dvm.extraOptions);
        }
        dvm.array = dvm.os.getSelectList(iris, searchText, iri => dvm.os.getEntityNameByListItem(iri));
    };
    dvm.onChange = function() {
        dvm.changeEvent({values: dvm.bindModel});
    };
}

export default ontologyClassSelectComponent;
