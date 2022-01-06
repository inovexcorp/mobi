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
import { isEmpty } from 'lodash';

import './ontologyEditorPage.component.scss';

const template = require('./ontologyEditorPage.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:ontologyEditorPage
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `ontologyEditorPage` is a component that creates a `div` containing the main components of the Ontology Editor.
 * These components are {@link ontology-editor.component:ontologySidebar},
 * {@link ontology-editor.component:ontologyTab} with the
 * {@link shared.service:ontologyStateService currently selected open ontology}, and
 * {@link ontology-editor.component:openOntologyTab}.
 */
const ontologyEditorPageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: ontologyEditorPageComponentCtrl
};

ontologyEditorPageComponentCtrl.$inject = ['ontologyStateService'];

function ontologyEditorPageComponentCtrl(ontologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;

    dvm.isOpenTab = function() {
        return isEmpty(dvm.os.listItem);
    }
}

export default ontologyEditorPageComponent;
