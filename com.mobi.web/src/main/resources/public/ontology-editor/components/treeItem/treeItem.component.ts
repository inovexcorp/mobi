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
import { get, unionWith, map, includes, isEqual } from 'lodash';

import './treeItem.component.scss';

const template = require('./treeItem.component.html');

const treeItemComponent = {
    template,
    bindings: {
        hasChildren: '<',
        isActive: '<',
        isBold: '<',
        onClick: '&',
        currentEntity: '<',
        isOpened: '<',
        path: '<',
        underline: '<',
        toggleOpen: '&',
        inProgressCommit: '<'
    },
    controllerAs: 'dvm',
    controller: treeItemComponentCtrl
};

treeItemComponentCtrl.$inject = ['settingsManagerService', 'ontologyStateService'];

function treeItemComponentCtrl(settingsManagerService, ontologyStateService) {
    var dvm = this;
    var os = ontologyStateService;
    dvm.treeDisplaySetting = '';
    dvm.treeDisplay = '';

    dvm.$onChanges = function(changesObj) {
        if (get(changesObj, 'currentEntity.isFirstChange')) {
            dvm.treeDisplaySetting = settingsManagerService.getTreeDisplay();
        }
        dvm.saved = dvm.isSaved();
        dvm.treeDisplay = dvm.getTreeDisplay();
    }
    dvm.getTreeDisplay = function() {
        if (dvm.treeDisplaySetting === 'pretty') {
            return os.getEntityNameByIndex(get(dvm.currentEntity, '@id'), os.listItem);
        }
        return get(dvm.currentEntity, 'mobi.anonymous', '');
    }
    dvm.isSaved = function() {
        var ids = unionWith(map(dvm.inProgressCommit.additions, '@id'), map(dvm.inProgressCommit.deletions, '@id'), isEqual);
        return includes(ids, get(dvm.currentEntity, '@id'));
    }
}

export default treeItemComponent;