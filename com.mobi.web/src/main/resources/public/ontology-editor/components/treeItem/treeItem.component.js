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
(function() {
    'use strict';

    const treeItemComponent = {
        templateUrl: 'ontology-editor/components/treeItem/treeItem.component.html',
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
            if (_.get(changesObj, 'currentEntity.isFirstChange')) {
                dvm.treeDisplaySetting = settingsManagerService.getTreeDisplay();
            }
            dvm.saved = dvm.isSaved();
            dvm.treeDisplay = dvm.getTreeDisplay();
        }
        dvm.getTreeDisplay = function() {
            if (dvm.treeDisplaySetting === 'pretty') {
                return os.getEntityNameByIndex(_.get(dvm.currentEntity, '@id'), os.listItem);
            }
            return _.get(dvm.currentEntity, 'mobi.anonymous', '');
        }
        dvm.isSaved = function() {
            var ids = _.unionWith(_.map(dvm.inProgressCommit.additions, '@id'), _.map(dvm.inProgressCommit.deletions, '@id'), _.isEqual);
            return _.includes(ids, _.get(dvm.currentEntity, '@id'));
        }
    }

    angular.module('ontology-editor')
        .component('treeItem', treeItemComponent);
})();
