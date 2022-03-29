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

import './classSelect.component.scss';
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
        isDisabledWhen: '<',
    },
    controllerAs: 'dvm',
    controller: classSelectComponentCtrl
};

classSelectComponentCtrl.$inject = ['$filter', 'ontologyManagerService', 'mapperStateService', 'utilService', 'prefixes'];

function classSelectComponentCtrl($filter, ontologyManagerService, mapperStateService, utilService, prefixes) {
    const dvm = this;
    const om = ontologyManagerService;
    const ms = mapperStateService;
    dvm.recordId = '';
    dvm.sourceCommit = '';
    dvm.selectClasses = [];
    dvm.currentText = null;
    dvm.isPending = false;

    dvm.getOntologyId = function(clazz) {
        return clazz.ontologyId || $filter('splitIRI')(clazz.classObj['@id']).begin;
    }
    dvm.setClasses = function(searchText) {
        dvm.recordId = ms.mapping.ontology['@id'];
        dvm.sourceCommit = ms.mapping.jsonld[0][prefixes.delim + 'sourceCommit'][0]['@id'];

        if (searchText !== dvm.currentText) {
            dvm.isPending = true;
            dvm.selectClasses = [];
            dvm.currentText = searchText;

            if (searchText) {
                om.retrieveClasses(dvm.recordId, '', dvm.sourceCommit, '100', searchText, 'class-dropdown')
                    .then(response => {
                        for(const [key, value] of Object.entries(response)) {
                            processClasses(key, value);
                        }
                        dvm.isPending = false;
                    }, () => dvm.isPending = false);
            } else {
                om.retrieveClasses(dvm.recordId, '', dvm.sourceCommit, '100', '', 'class-dropdown')
                    .then(response => {
                        for(const [key, value] of Object.entries(response)) {
                            processClasses(key, value);
                        }
                        dvm.isPending = false;
                    }, () => dvm.isPending = false);
            }
        }
    }

    function processClasses(ontology, classList) {
        const classObjects = classList.results?.bindings
        classObjects.forEach(classItem => {
            let proposedClass = {
                ontologyId: ontology,
                classObj: {}
            }

            proposedClass['groupHeader'] = dvm.getOntologyId(proposedClass);
            proposedClass['isDeprecated'] = classItem.deprecated ? classItem.deprecated.value : false;
            proposedClass.classObj['@id'] = classItem.id.value;
            proposedClass.classObj['@type'] = 'http://www/w3/org/2002/07/owl#Class';
            proposedClass.classObj['name'] = classItem.label ? classItem.label.value : utilService.getBeautifulIRI(classItem.id.value);
            proposedClass.classObj['description'] = classItem.description ? classItem.description.value : undefined;

            dvm.selectClasses.push(proposedClass);
        });
    }
}

export default classSelectComponent;
