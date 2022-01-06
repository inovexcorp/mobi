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
const template = require('./serializationSelect.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:serializationSelect
 *
 * @description
 * `serializationSelect` is a component that creates a `div.form-group` with a `select` containing serialization
 * formats for ontologies.
 *
 * @param {string} bindModel The variable to bind the value of the select field to
 * @param {Function} changeEvent A function that will be called when the value of the `select` changes. Should
 * update the value of `bindModel`. Expects an argument called `value`.
 */
const serializationSelectComponent = {
    template,
    bindings: {
        bindModel: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: serializationSelectComponentCtrl
};

function serializationSelectComponentCtrl() {
    var dvm = this;

    dvm.onChange = function() {
        dvm.changeEvent({value: dvm.bindModel});
    }
}

export default serializationSelectComponent;
