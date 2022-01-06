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
import { find } from 'lodash';

import './commitsTab.component.scss';

const template = require('./commitsTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:commitsTab
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 *
 * @description
 * `commitsTab` is a component that creates a page containing the {@link shared.component:commitHistoryTable}
 * for the current {@link shared.service:ontologyStateService selected ontology} with a graph. It also creates a
 * table with buttons for viewing the ontology at each commit.
 */
const commitsTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: commitsTabComponentCtrl
};

commitsTabComponentCtrl.$inject = ['ontologyStateService', 'utilService', 'prefixes'];

function commitsTabComponentCtrl(ontologyStateService, utilService, prefixes) {
    var dvm = this;
    dvm.os = ontologyStateService;
    dvm.util = utilService;
    dvm.commits = [];

    dvm.getHeadTitle = function() {
        if (dvm.os.listItem.ontologyRecord.branchId) {
            return dvm.util.getDctermsValue(find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId}), 'title');
        } else {
            var currentState = dvm.os.getCurrentStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
            if (dvm.os.isStateTag(currentState)) {
                var tagId = dvm.util.getPropertyId(currentState, prefixes.ontologyState + 'tag');
                var tag = find(dvm.os.listItem.tags, {'@id': tagId});
                return dvm.util.getDctermsValue(tag, 'title');
            } else {
                return '';
            }
        }
    }
    dvm.openOntologyAtCommit = function(commit) {
        dvm.os.updateOntologyWithCommit(dvm.os.listItem.ontologyRecord.recordId, commit.id);
    }
}

export default commitsTabComponent;
