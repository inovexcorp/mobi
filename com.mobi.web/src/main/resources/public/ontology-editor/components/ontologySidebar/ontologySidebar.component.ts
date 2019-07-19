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
import { isEmpty } from 'lodash';

import './ontologySidebar.component.scss';

const template = require('./ontologySidebar.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:ontologySidebar
 * @requires shared.service:ontologyStateService
 * @requires shared.service:modalService
 *
 * @description
 * `ontologySidebar` is a component that creates a `div` containing a button to
 * {@link ontologyDefaultTab.directive:ontologyDefaultTab open ontologies} and a `nav` of the
 * {@link shared.service:ontologyStateService opened ontologies}. The currently selected
 * {@link shared.service:ontologyStateService listItem} will have a
 * {@link ontologyBranchSelect.directive:ontologyBranchSelect} displayed underneath and a link to
 * {@link ontology-editor.component:ontologyCloseOverlay close the ontology}. 
 */

const ontologySidebarComponent = {
    template,
    bindings: {
        list: '<'
    },
    controllerAs: 'dvm',
    controller: ontologySidebarComponentCtrl
};

ontologySidebarComponentCtrl.$inject = ['ontologyStateService', 'modalService'];

function ontologySidebarComponentCtrl(ontologyStateService, modalService) {
    var dvm = this;
    dvm.os = ontologyStateService;

    dvm.onClose = function(listItem) {
        if (dvm.os.hasChanges(listItem)) {
            dvm.os.recordIdToClose = listItem.ontologyRecord.recordId;
            modalService.openModal('ontologyCloseOverlay');
        } else {
            dvm.os.closeOntology(listItem.ontologyRecord.recordId);
        }
    }
    dvm.onClick = function(listItem) {
        var previousListItem = dvm.os.listItem;
        if (previousListItem) {
            previousListItem.active = false;
            if (previousListItem.goTo) {
                previousListItem.goTo.active = false;
                previousListItem.goTo.entityIRI = '';
            }
        }
        if (listItem && !isEmpty(listItem)) {
            listItem.active = true;
            dvm.os.listItem = listItem;
        } else {
            dvm.os.listItem = {};
        }
    }
}

export default ontologySidebarComponent;