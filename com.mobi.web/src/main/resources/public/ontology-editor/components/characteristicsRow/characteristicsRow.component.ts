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
import './characteristicsRow.component.scss';

const template = require('./characteristicsRow.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:characteristicsRow
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `characteristicsRow` is a component that creates a Bootstrap `.row` that displays the
 * {@link ontology-editor.component:characteristicsBlock} depending on whether the
 * {@link shared.service:ontologyStateService selected entity} is a object or data property.
 */
const characteristicsRowComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: characteristicsRowComponentCtrl
};

characteristicsRowComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService'];

function characteristicsRowComponentCtrl(ontologyManagerService, ontologyStateService) {
    var dvm = this;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;

    dvm.updateTypes = function(types) {
        dvm.os.listItem.selected['@types'] = types;
        // TODO: Remove when the full RDF list is removed
        var entityFromFullList = dvm.os.getEntityByRecordId(dvm.os.listItem.versionedRdfRecord.recordId, dvm.os.listItem.selected['@id']);
        entityFromFullList['@types'] = types; 

    }
}

export default characteristicsRowComponent;
