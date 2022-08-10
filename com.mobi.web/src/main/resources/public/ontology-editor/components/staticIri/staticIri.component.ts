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
import './staticIri.component.scss';

const template = require('./staticIri.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:staticIri
 * @requires shared.service:ontologyStateService
 * @requires shared.service:modalService
 *
 * @description
 * `staticIri` is a component that creates a `div` with a display of the provided IRI of an entity. If
 * `duplicateCheck` is true, an {@link shared.component:errorDisplay} will be displayed if the IRI already
 * exists in the current {@link shared.service:ontologyStateService selected ontology}. The the IRI if
 * for an entity that is not imported, an edit button is displayed that will open the
 * {@link shared.component:editIriOverlay}. The component accepts a method that will be called when an
 * edit of the IRI is completed. 
 *
 * @param {string} iri The IRI to be displayed and optionally edited
 * @param {boolean} readOnly Whether the IRI should be editable or not
 * @param {boolean} duplicateCheck Whether the IRI should be checked for duplicates within the selected ontology
 * @param {string} highlightText The optional text to highlight within the IRI
 * @param {Function} onEdit A function to be called when the `editIriOverlay` is confirmed
 */
const staticIriComponent = {
    template,
    bindings: {
        iri: '<',
        readOnly: '<',
        duplicateCheck: '<',
        highlightText: '<',
        onEdit: '&'
    },
    controllerAs: 'dvm',
    controller: staticIriComponentCtrl
};

staticIriComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'modalService'];

function staticIriComponentCtrl($filter, ontologyStateService: OntologyStateService, modalService) {
    var dvm = this;
    dvm.os = ontologyStateService;

    dvm.$onInit = function() {
        dvm.setVariables();
    }
    dvm.$onChanges = function(changesObj) {
        if (!changesObj.iri || !changesObj.iri.isFirstChange()) {
            dvm.setVariables();
        }
    }
    dvm.setVariables = function(obj) {
        var splitIri = $filter('splitIRI')(dvm.iri);
        dvm.iriBegin = splitIri.begin;
        dvm.iriThen = splitIri.then;
        dvm.iriEnd = splitIri.end;
    }
    dvm.showIriOverlay = function() {
        var resolveObj: any = {
            iriBegin: dvm.iriBegin,
            iriThen: dvm.iriThen,
            iriEnd: dvm.iriEnd,
        };
        if (dvm.duplicateCheck) {
            resolveObj.customValidation = {
                func: dvm.os.checkIri,
                msg: 'This IRI already exists'
            };
        }
        modalService.openModal('editIriOverlayAjs', resolveObj, dvm.onEdit);
    }
}

export default staticIriComponent;
