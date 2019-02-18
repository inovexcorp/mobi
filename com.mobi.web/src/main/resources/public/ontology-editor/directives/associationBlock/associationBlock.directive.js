(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name associationBlock
         *
         * @description
         * The `associationBlock` module only provides the `associationBlock` directive which creates a section for
         * displaying the classes and properties in an ontology.
         */
        .module('associationBlock', [])
        /**
         * @ngdoc directive
         * @name associationBlock.directive:associationBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `associationBlock` is a directive that creates a section that displays the
         * {@link everythingTree.directive:everythingTree} for the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The directive is replaced by the
         * contents of its template.
         */
        .directive('associationBlock', associationBlock);

        associationBlock.$inject = ['ontologyStateService'];

        function associationBlock(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                },
                templateUrl: 'ontology-editor/directives/associationBlock/associationBlock.directive.html'
            }
        }
})();
