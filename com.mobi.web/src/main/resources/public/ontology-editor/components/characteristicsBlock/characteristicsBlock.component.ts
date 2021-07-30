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
import { forEach, pull, includes, get, unset, find, isEqual, remove } from 'lodash';

import './characteristicsBlock.component.scss';

const template = require('./characteristicsBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:characteristicsBlock
 * @requires shared.service:prefixes
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 *
 * @description
 * `characteristicsBlock` is a component that creates a section that displays the appropriate characteristics
 * based on the provided `types` array for the entity identified by the provided `iri`. Characteristics are
 * displayed as {@link shared.component:checkbox checkboxes}. The `types` array is one way bound so the provided
 * `updateTypes` functio is expected to update the value of `types` when a checkbox changes.
 * 
 * @param {string} iri An IRI string for an entity in the current {@link shared.service:ontologyStateService}
 * @param {string[]} types An array of IRI strings
 * @param {Function} updateTypes A function to be called when the value of a checkbox changes. Should update the
 * value of `types`. Expects an argument called `value`
 */
const characteristicsBlockComponent = {
    template,
    bindings: {
        iri: '<',
        types: '<',
        updateTypes: '&'
    },
    controllerAs: 'dvm',
    controller: characteristicsBlockComponentCtrl
};

characteristicsBlockComponentCtrl.$inject = ['prefixes', 'ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

function characteristicsBlockComponentCtrl(prefixes, ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
    var dvm = this;
    var ontoUtils = ontologyUtilsManagerService;
    var om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.characteristics = [
        {
            checked: false,
            typeIRI: prefixes.owl + 'FunctionalProperty',
            displayText: 'Functional Property',
            objectOnly: false
        },
        {
            checked: false,
            typeIRI: prefixes.owl + 'AsymmetricProperty',
            displayText: 'Asymmetric Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: prefixes.owl + 'SymmetricProperty',
            displayText: 'Symmetric Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: prefixes.owl + 'TransitiveProperty',
            displayText: 'Transitive Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: prefixes.owl + 'ReflexiveProperty',
            displayText: 'Reflexive Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: prefixes.owl + 'IrreflexiveProperty',
            displayText: 'Irreflexive Property',
            objectOnly: true
        }
    ];

    dvm.$onChanges = function() {
        setVariables();
    }
    dvm.filter = function(obj) {
        return !obj.objectOnly || om.isObjectProperty({'@type': dvm.types || []});
    }
    dvm.onChange = function(characteristicObj, value) {
        characteristicObj.checked = value;
        var types = dvm.types || [];
        if (characteristicObj.checked) {
            types.push(characteristicObj.typeIRI);
            handleCase(dvm.os.listItem.deletions, dvm.os.addToAdditions, characteristicObj.typeIRI);
        } else {
            pull(types, characteristicObj.typeIRI);
            handleCase(dvm.os.listItem.additions, dvm.os.addToDeletions, characteristicObj.typeIRI);
        }
        dvm.updateTypes({value: types});
        ontoUtils.saveCurrentChanges();
    }

    function handleCase(array, method, typeIRI) {
        var match = find(array, item => includes(get(item, '@type', []), typeIRI));
        if (match) {
            removeTypeFrom(match, typeIRI);
            if (!get(match, '@type', []).length) {
                unset(match, '@type');
            }
            if (isEqual(Object.keys(match), ['@id'])) {
                remove(array, match);
            }
        } else {
            method(dvm.os.listItem.ontologyRecord.recordId, {
                '@id': dvm.iri,
                '@type': [typeIRI]
            });
        }
    }

    function removeTypeFrom(object, typeToRemove) {
        pull(get(object, '@type', []), typeToRemove);
    }

    function setVariables() {
        forEach(dvm.characteristics, obj => {
            obj.checked = includes(dvm.types, obj.typeIRI);
        });
    }
}

export default characteristicsBlockComponent;