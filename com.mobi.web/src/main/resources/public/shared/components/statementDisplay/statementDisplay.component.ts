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
import { has, get } from 'lodash';

import './statementDisplay.component.scss';

const template = require('./statementDisplay.component.html');

/**
 * @ngdoc component
 * @name shared.component:statementDisplay
 *
 * @description
 * `statementDisplay` is a component that creates a div displaying the provided predicate and object.
 *
 * @param {string} predicate A string of the predicate to display
 * @param {Object} object An object representing the object of a triple to display
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by it's IRI.
 */
const statementDisplayComponent = {
    template,
    require: '^^statementContainer',
    bindings: {
        predicate: '<',
        object: '<',
        entityNameFunc: '<?'
    },
    controllerAs: 'dvm',
    controller: statementDisplayComponentCtrl
};

statementDisplayComponentCtrl.$inject = ['$filter'];

function statementDisplayComponentCtrl($filter) {
    var dvm = this;
    dvm.$onInit = function () {
        if (has(dvm.object, '@id')) {
            dvm.fullObject = dvm.object['@id'];
            dvm.o = $filter('splitIRI')(dvm.fullObject).end || dvm.fullObject;
        } else {
            dvm.o = get(dvm.object, '@value', dvm.object)
                + (has(dvm.object, '@language') ? ' [language: ' + dvm.object['@language'] + ']' : '')
                + (has(dvm.object, '@type') ? ' [type: ' + $filter('prefixation')(dvm.object['@type']) + ']' : '');
            dvm.fullObject = dvm.o;
        }
    }
    dvm.displayObj = function () {
        return dvm.entityNameFunc && has(dvm.object, '@id') ? dvm.entityNameFunc(dvm.fullObject) : dvm.o;
    }
}

export default statementDisplayComponent;
