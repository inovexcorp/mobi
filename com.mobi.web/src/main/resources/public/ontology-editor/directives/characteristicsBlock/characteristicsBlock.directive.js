(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name characteristicsBlock
         *
         * @description
         * The `characteristicsBlock` module only provides the `characteristicsBlock` directive which creates a
         * section for displaying the characteristics on a property.
         */
        .module('characteristicsBlock', [])
        /**
         * @ngdoc directive
         * @name characteristicsBlock.directive:characteristicsBlock
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `characteristicsBlock` is a directive that creates a section that displays the appropriate characteristics
         * on the {@link ontologyState.service:ontologyStateService selected property} based on its type.
         * Characteristics are displayed as {@link checkbox.directive:checkbox checkboxes}. The directive is replaced
         * by the contents of its template.
         */
        .directive('characteristicsBlock', characteristicsBlock);

        characteristicsBlock.$inject = ['prefixes', 'ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

        function characteristicsBlock(prefixes, ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/characteristicsBlock/characteristicsBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.characteristics = [
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'FunctionalProperty',
                            displayText: 'Functional Property',
                            objectOnly: false
                        },
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'AsymmetricProperty',
                            displayText: 'Asymmetric Property',
                            objectOnly: true
                        }
                    ];

                    dvm.filter = function(obj) {
                        return !obj.objectOnly || om.isObjectProperty(dvm.os.listItem.selected);
                    }
                    dvm.onChange = function(characteristicObj) {
                        if (characteristicObj.checked) {
                            _.set(dvm.os.listItem.selected, '@type', _.concat(_.get(dvm.os.listItem.selected, '@type', []), characteristicObj.typeIRI));
                            handleCase(dvm.os.listItem.deletions, dvm.os.addToAdditions, characteristicObj.typeIRI);
                        } else {
                            removeTypeFrom(dvm.os.listItem.selected, characteristicObj.typeIRI);
                            handleCase(dvm.os.listItem.additions, dvm.os.addToDeletions, characteristicObj.typeIRI);
                        }
                        ontoUtils.saveCurrentChanges();
                    }

                    function handleCase(array, method, typeIRI) {
                        var match = _.find(array, item => _.includes(_.get(item, '@type', []), typeIRI));
                        if (match) {
                            removeTypeFrom(match, typeIRI);
                            if (!_.get(match, '@type', []).length) {
                                _.unset(match, '@type');
                            }
                            if (_.isEqual(_.keys(match), ['@id'])) {
                                _.remove(array, match);
                            }
                        } else {
                            method(dvm.os.listItem.ontologyRecord.recordId, {
                                '@id': dvm.os.listItem.selected['@id'],
                                '@type': [typeIRI]
                            });
                        }
                    }

                    function removeTypeFrom(object, typeToRemove) {
                        _.remove(_.get(object, '@type', []), type => type === typeToRemove);
                    }

                    function setVariables() {
                        _.forEach(dvm.characteristics, obj => {
                            obj.checked = _.includes(_.get(dvm.os.listItem.selected, '@type', []), obj.typeIRI);
                        });
                    }

                    setVariables();

                    $scope.$watch('dvm.os.listItem.selected', setVariables);
                }]
            }
        }
})();
