(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name newDatasetOverlay.component:newDatasetOverlay
     * @requires datasetManager.service:datasetManagerService
     * @requires datasetState.service:datasetStateService
     * @requires util.service:utilService
     *
     * @description
     * `newDatasetOverlay` is a component that creates content for a modal with a form containing fields for
     * creating a new Dataset Record. The fields are for the title, repository id, dataset IRI, description,
     * {@link keywordSelect.directive:keywordSelect keywords}, and
     * {@link datasetsOntologyPicker.directive:datasetsOntologyPicker ontologies to be linked} to the new Dataset
     * Record. The repository id is a static field for now. Meant to be used in conjunction with the
     * {@link modalService.directive:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const newDatasetOverlayComponent = {
        templateUrl: 'datasets/directives/newDatasetOverlay/newDatasetOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: newDatasetOverlayComponentCtrl
    };

    newDatasetOverlayComponentCtrl.$inject = ['datasetManagerService', 'datasetStateService', 'utilService'];

    function newDatasetOverlayComponentCtrl(datasetManagerService, datasetStateService, utilService) {
        var dvm = this;
        var state = datasetStateService;
        var dm = datasetManagerService;
        dvm.util = utilService;
        dvm.error = '';
        dvm.recordConfig = {
            title: '',
            repositoryId: 'system',
            datasetIRI: '',
            description: ''
        };
        dvm.keywords = [];
        dvm.selectedOntologies = [];

        dvm.selectOntology = function(ontology) {
            dvm.selectedOntologies.push(ontology);
            dvm.selectedOntologies = _.sortBy(dvm.selectedOntologies, 'title');
        }
        dvm.unselectOntology = function(ontology) {
            _.remove(dvm.selectedOntologies, {recordId: ontology.recordId});
        }
        dvm.create = function() {
            dvm.recordConfig.keywords = _.map(dvm.keywords, _.trim);
            dvm.recordConfig.ontologies = _.map(dvm.selectedOntologies, 'recordId');
            dm.createDatasetRecord(dvm.recordConfig)
                .then(() => {
                    dvm.util.createSuccessToast('Dataset successfully created');
                    state.setResults();
                    dvm.close();
                }, onError);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }

        function onError(errorMessage) {
            dvm.error = errorMessage;
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name newDatasetOverlay
         *
         * @description
         * The `newDatasetOverlay` module only provides the `newDatasetOverlay` component which creates content for a
         * modal to create a new Dataset Record.
         */
        .module('newDatasetOverlay', [])
        .component('newDatasetOverlay', newDatasetOverlayComponent);
})();
