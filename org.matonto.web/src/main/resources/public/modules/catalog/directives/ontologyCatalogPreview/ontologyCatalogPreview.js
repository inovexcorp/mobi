(function() {
    'use strict';

    angular
        .module('ontologyCatalogPreview', ['ontologyManager'])
        .directive('ontologyCatalogPreview', ontologyCatalogPreview);

        ontologyCatalogPreview.$inject = ['ontologyManagerService'];

        function ontologyCatalogPreview(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontologyId: '='
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.numPreview = 5;
                    dvm.classes = [];
                    dvm.props = [];

                    $scope.$watch('ontologyId', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            setLists();
                        }
                    });

                    dvm.getPrettyName = function(iri) {
                        return ontologyManagerService.getBeautifulIRI(iri);
                    }
                    dvm.getClasses = function() {
                        return dvm.moreClasses ? dvm.classes : _.take(dvm.classes, dvm.numPreview);
                    }
                    dvm.getProps = function() {
                        return dvm.moreProps ? dvm.props : _.take(dvm.props, dvm.numPreview);
                    }
                    function setLists() {
                        ontologyManagerService.getClassIris(dvm.ontologyId).then(function(list) {
                            dvm.classes = list;
                            return ontologyManagerService.getPropertyIris(dvm.ontologyId);
                        }, function(error) {
                            dvm.errorMessage = error.statusText;
                        }).then(function(response) {
                            dvm.props = response;
                        }, function(error) {
                            dvm.errorMessage = error.statusText;
                        });
                    }

                    setLists();
                }],
                templateUrl: 'modules/catalog/directives/ontologyCatalogPreview/ontologyCatalogPreview.html'
            }
        }
})();
