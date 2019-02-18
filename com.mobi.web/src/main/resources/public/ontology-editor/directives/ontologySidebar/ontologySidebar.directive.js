(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologySidebar
         *
         * @description
         * The `ontologySidebar` module provides the `ontologySidebar` directive which creates a `div` with the sidebar
         * of the Ontology Editor.
         */
        .module('ontologySidebar', [])
        /**
         * @ngdoc directive
         * @name ontologySidebar.directive:ontologySidebar
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires modal.service:modalService
         *
         * @description
         * `ontologySidebar` is a directive that creates a `div` containing a button to
         * {@link ontologyDefaultTab.directive:ontologyDefaultTab open ontologies} and a `nav` of the
         * {@link ontologyState.service:ontologyStateService opened ontologies}. The currently selected
         * {@link ontologyState.service:ontologyStateService listItem} will have a
         * {@link ontologyBranchSelect.directive:ontologyBranchSelect} displayed underneath and a link to
         * {@link ontologyCloseOverlay.directive:ontologyCloseOverlay close the ontology}. The directive is
         * replaced by the contents of its template.
         */
        .directive('ontologySidebar', ontologySidebar);

        ontologySidebar.$inject = ['ontologyManagerService', 'ontologyStateService', 'modalService'];

        function ontologySidebar(ontologyManagerService, ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologySidebar/ontologySidebar.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
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
                        }
                        if (listItem && !_.isEmpty(listItem)) {
                            listItem.active = true;
                            dvm.os.listItem = listItem;
                        } else {
                            dvm.os.listItem = {};
                        }
                    }
                }
            }
        }
})();
