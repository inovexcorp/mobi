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
import * as angular from 'angular';
import { filter, includes, map, forEach } from 'lodash';

const template = require('./classSelect.component.html');

/**
 * @ngdoc component
 * @name mapper.component:classSelect
 * @requires $filter
 * @requires shared.service:ontologyManagerService
 *
 * @description
 * `classSelect` is a component which creates a `ui-select` with the passed class list and binds the selected class
 * object to `selectedClass`, but only one way. The provided `changeEvent` function is expected to update the value
 * of `selectedClass`. The `ui-select` can optionally be disabled with the provided `isDisabledWhen`.
 *
 * @param {Object} selectedClass The currently selected class object
 * @param {string} selectedClass.ontologyid The id of the ontology that contains the class
 * @param {Object} selectedClass.classObj The JSON-LD class object
 * @param {Function} changeEvent An function to be called when the selected class is changed. Should update the
 * value of `selectedClass`. Expects an argument called `value`.
 * @param {Object[]} classes an array of class objects from the
 * {@link shared.service:mapperStateService mapperStateService}
 */
const classSelectComponent = {
    template,
    bindings: {
        selectedClass: '<',
        changeEvent: '&',
        classes: '<',
        isDisabledWhen: '<',
    },
    controllerAs: 'dvm',
    controller: classSelectComponentCtrl
};

classSelectComponentCtrl.$inject = ['$filter', 'ontologyManagerService'];

function classSelectComponentCtrl($filter, ontologyManagerService) {
    var dvm = this;
    var om = ontologyManagerService;
    dvm.selectClasses = [];

    dvm.getOntologyId = function(clazz) {
        return clazz.ontologyId || $filter('splitIRI')(clazz.classObj['@id']).begin;
    }
    dvm.setClasses = function(searchText) {
        var tempClasses = angular.copy(dvm.classes);
        forEach(tempClasses, clazz => {
            clazz.name = om.getEntityName(clazz.classObj);
        });
        if (searchText) {
            tempClasses = filter(tempClasses, clazz => includes(clazz.name.toLowerCase(), searchText.toLowerCase()));
        }
        tempClasses.sort((clazz1, clazz2) => clazz1.name.localeCompare(clazz2.name));
        dvm.selectClasses = map(tempClasses.slice(0, 100), clazz => {
            clazz.isDeprecated = om.isDeprecated(clazz.classObj);
            clazz.groupHeader = dvm.getOntologyId(clazz);
            return clazz;
        });
    }
}

export default classSelectComponent;