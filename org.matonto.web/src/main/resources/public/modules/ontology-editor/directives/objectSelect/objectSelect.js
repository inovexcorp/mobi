(function() {
    'use strict';

    angular
        .module('objectSelect', ['customLabel', 'ontologyManager', 'responseObj', 'settingsManager', 'stateManager'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj', 'settingsManagerService', 'stateManagerService'];

        function objectSelect(ontologyManagerService, responseObj, settingsManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                scope: {
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    selectList: '=',
                    mutedText: '=',
                    isDisabledWhen: '='
                },
                bindToController: {
                    bindModel: '=ngModel',
                    selectedId: '=',
                    ontologyId: '@'
                },
                controllerAs: 'dvm',
                controller: ['prefixes', function(prefixes) {
                    var dvm = this;
                    var tooltipDisplay = settingsManagerService.getTooltipDisplay();

                    dvm.getItemOntologyIri = function(item) {
                        return item.ontologyIri || dvm.ontologyId;
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
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "description'][0]['@value']", itemIri));
                        } else if(tooltipDisplay === 'label') {
                            result = _.get(selectedObject, "['" + prefixes.rdfs + "label'][0]['@value']", _.get(selectedObject, "['" + prefixes.dc + "title'][0]['@value']", itemIri));
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
