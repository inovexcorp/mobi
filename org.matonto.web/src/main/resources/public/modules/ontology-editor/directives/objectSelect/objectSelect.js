(function() {
    'use strict';

    angular
        .module('objectSelect', ['customLabel', 'ontologyManager', 'responseObj', 'settingsManager', 'stateManager'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj', 'settingsManagerService', 'stateManagerService'];

        function objectSelect(ontologyManagerService, responseObj, settingsManagerService, stateManagerService) {
            return {
                restrict: 'E',
                scope: {
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    onlyStrings: '=',
                    selectList: '=',
                    mutedText: '='
                },
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                bindToController: {
                    bindModel: '=ngModel',
                    selectedId: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var vm = $scope.$parent.vm;
                    var tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return item.ontologyIri || vm.ontologies[vm.state.oi]['@id'];
                    }

                    dvm.getItemIri = function(item) {
                        return responseObj.getItemIri(item);
                    }

                    dvm.getTooltipDisplay = function(item) {
                        var itemIri = item['@id'] ? item['@id'] : dvm.getItemIri(item);
                        var ontologyIndex = _.get(stateManagerService.getState(), 'oi', undefined);
                        var selectedObject = ontologyManagerService.getObjectCopyByIri(itemIri, ontologyIndex);
                        var result = '';

                        if(_.get(selectedObject, tooltipDisplay, undefined) && tooltipDisplay !== '@id') {
                            result = selectedObject[tooltipDisplay][0]['@value'];
                        } else if(_.get(selectedObject, '@id', undefined)) {
                            result = selectedObject['@id'];
                        } else {
                            result = itemIri;
                        }

                        return result;
                    }
                }]
            }
        }
})();
