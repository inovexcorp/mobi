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
                    selectList: '=',
                    mutedText: '=',
                    isDisabledWhen: '='
                },
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                bindToController: {
                    bindModel: '=ngModel',
                    selectedId: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', 'prefixes', function($scope, prefixes) {
                    var dvm = this;
                    var vm = $scope.$parent.vm;
                    var tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return item.ontologyIri || vm.ontologies[vm.state.oi]['@id'];
                    }

                    dvm.getItemIri = function(item) {
                        return item['@id'] || responseObj.getItemIri(item);
                    }

                    dvm.getTooltipDisplay = function(item) {
                        var itemIri = item['@id'] ? item['@id'] : dvm.getItemIri(item);
                        var ontologyIndex = _.get(stateManagerService.getState(), 'oi');
                        var selectedObject = ontologyManagerService.getObjectCopyByIri(itemIri, ontologyIndex);
                        var result = itemIri;

                        if(tooltipDisplay === 'comment') {
                            if(_.has(selectedObject, prefixes.rdfs + 'comment')) {
                                result = selectedObject[prefixes.rdfs + 'comment'][0]['@value'];
                            } else if(_.has(selectedObject, prefixes.dc + 'description')) {
                                result = selectedObject[prefixes.dc + 'description'][0]['@value'];
                            }
                        } else if(tooltipDisplay === 'label') {
                            if(_.has(selectedObject, prefixes.rdfs + 'label')) {
                                result = selectedObject[prefixes.rdfs + 'label'][0]['@value'];
                            } else if(_.has(selectedObject, prefixes.dc + 'title')) {
                                result = selectedObject[prefixes.dc + 'title'][0]['@value'];
                            }
                        } else if(_.has(selectedObject, '@id')) {
                            result = selectedObject['@id'];
                        }

                        return result;
                    }

                    dvm.isBlankNode = function(id) {
                        return typeof id === 'string' && id.includes('_:b');
                    }

                    dvm.getBlankNodeValue = function(id) {
                        var result;

                        if(typeof id === 'string' && id.includes('_:b')) {
                            var propertyIRI = _.get(vm.ontology.matonto.propertyExpressions, id);
                            var classIRI = _.get(vm.ontology.matonto.classExpressions, id);
                            var unionOfIRI = _.get(vm.ontology.matonto.unionOfs, id);
                            var intersectionOfIRI = _.get(vm.ontology.matonto.intersectionOfs, id);

                            result = propertyIRI || classIRI || unionOfIRI || intersectionOfIRI;
                        }

                        return result;
                    }
                }]
            }
        }
})();
