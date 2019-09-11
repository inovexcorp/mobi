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

    /**
     * @ngdoc component
     * @name ontology-editor.component:ontologyButtonStack
     * @requires shared.service:ontologyStateService
     * @requires shared.service:modalService
     *
     * @description
     * `ontologyButtonStack` is a component that creates a {@link shared.component:circleButtonStack} for actions in
     * the Ontology Editor against the current {@link shared.service:ontologyStateService selected ontology}. These
     * actions are uploading a file of changes, creating a branch, merging branches, and committing changes. The
     * component houses the methods for opening modals for
     * {@link ontology-editor.component:uploadChangesOverlay uploading changes},
     * {@link ontology-editor.component:createBranchOverlay creating branches},
     * {@link ontology-editor.component:commitOverlay committing}, and
     * {@link ontology-editor.component:createEntityModal creating entities}.
     */
    const ontologyButtonStackComponent = {
        templateUrl: 'ontology-editor/components/ontologyButtonStack/ontologyButtonStack.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: ontologyButtonStackComponentCtrl
    };

    ontologyButtonStackComponentCtrl.$inject = ['ontologyStateService', 'modalService'];

    function ontologyButtonStackComponentCtrl(ontologyStateService, modalService) {
        var dvm = this;
        dvm.os = ontologyStateService;

        dvm.showCreateBranchOverlay = function() {
            modalService.openModal('createBranchOverlay');
        }
        dvm.showCreateTagModal = function() {
            modalService.openModal('createTagModal');
        }
        dvm.showCommitOverlay = function() {
            modalService.openModal('commitOverlay');
        }
        dvm.showUploadChangesOverlay = function() {
            modalService.openModal('uploadChangesOverlay');
        }
        dvm.showCreateEntityOverlay = function() {
            if (dvm.os.getActiveKey() !== 'project') {
                dvm.os.unSelectItem();
            }
            modalService.openModal('createEntityModal', undefined, undefined, 'sm');
        }
    }

    angular.module('ontology-editor')
        .component('ontologyButtonStack', ontologyButtonStackComponent);
})();
