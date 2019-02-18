(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editMappingForm
         *
         * @description
         * The `editMappingForm` module only provides the `editMappingForm` directive which creates a form with
         * different sections for editing the current {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('editMappingForm', [])
        /**
         * @ngdoc directive
         * @name editMappingForm.directive:editMappingForm
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         * @requires modal.service:modalService
         *
         * @description
         * `editMappingForm` is a directive that creates a div with a section to view and edit the current
         * {@link mapperState.service:mapperStateService#mapping mapping} configuration, a section to
         * {@link classMappingSelect.directive:classMappingSelect select a class mapping} and delete the selected class
         * mapping, a button to {@link classMappingOverlay.component:classMappingOverlay add a new class mapping}, and
         * {@link classMappingDetails.directive:classMappingDetails class mapping details}. The directive houses the
         * method for opening a modal to remove a ClassMapping. The directive is replaced by the contents of its
         * template.
         */
        .directive('editMappingForm', editMappingForm);

        editMappingForm.$inject = ['mapperStateService', 'utilService', 'modalService'];

        function editMappingForm(mapperStateService, utilService, modalService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.util = utilService;

                    dvm.openClassMappingOverlay = function() {
                        modalService.openModal('classMappingOverlay');
                    }
                    dvm.openMappingConfig = function() {
                        modalService.openModal('mappingConfigOverlay', {}, undefined, 'lg');
                    }
                    dvm.confirmDeleteClass = function() {
                        modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.getEntityName(dvm.state.selectedClassMappingId) + '</strong>?</p><p class="form-text">Deleting a class will remove any properties that link to it.</p>', dvm.deleteClass);
                    }
                    dvm.deleteClass = function() {
                        dvm.state.deleteClass(dvm.state.selectedClassMappingId);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = '';
                    }
                    dvm.getEntityName = function(id) {
                        return dvm.util.getDctermsValue(_.find(dvm.state.mapping.jsonld, {'@id': id}), 'title');
                    }
                },
                templateUrl: 'mapper/directives/editMappingForm/editMappingForm.directive.html'
            }
        }
})();
