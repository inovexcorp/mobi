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

const template = require('./mergeTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:mergeTab
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `mergeTab` is a component that creates a contains for performing a direct merge between two branches in the
 * currently {@link shared.service:ontologyStateService selected ontology}. If there are no conflicts, a
 * {@link ontology-editor.component:mergeBlock} is shown. If there are conflicts, a
 * {@link ontology-editor.component:resolveConflictsForm} is shown.
 */
const mergeTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: mergeTabComponentCtrl
};

mergeTabComponentCtrl.$inject = ['ontologyStateService'];

function mergeTabComponentCtrl(ontologyStateService) {
    var dvm = this;
    dvm.os = ontologyStateService;
}

export default mergeTabComponent;