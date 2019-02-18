(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyButtonStack
         *
         * @description
         * The `ontologyButtonStack` module only provides the `ontologyButtonStack` directive which creates a
         * {@link circleButtonStack.directive:circleButtonStack} for actions in the Ontology Editor.
         */
        .module('ontologyButtonStack', [])
        /**
         * @ngdoc directive
         * @name ontologyButtonStack.directive:ontologyButtonStack
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires modal.service:modalService
         *
         * @description
         * `ontologyButtonStack` is a directive that creates a {@link circleButtonStack.directive:circleButtonStack}
         * for actions in the Ontology Editor against the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. These actions are uploading a file of
         * changes, creating a branch, merging branches, and commiting changes. The directive houses the methods for
         * opening modals for {@link uploadChangesOverlay.directive:uploadChangesOverlay uploading changes},
         * {@link createBranchOverlay.directive:createBranchOverlay creating branches},
         * {@link commitOverlay.directive:commitOverlay commiting}, and
         * {@link createEntityModal.directive:createEntityModal creating entities}. The directive is replaced by the
         * contents of its template.
         */
        .directive('ontologyButtonStack', ontologyButtonStack);

        ontologyButtonStack.$inject = ['ontologyStateService', 'modalService'];

        function ontologyButtonStack(ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyButtonStack/ontologyButtonStack.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
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
            }
        }
})();
