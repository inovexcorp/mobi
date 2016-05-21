(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name customLabel
         *
         * @description 
         * The `customLabel` module only provides the `customLabel` directive which creates
         * a label element with transcluded content and optional muted text.
         */
        .module('customLabel', [])
        /**
         * @ngdoc directive
         * @name customLabel.directive:customLabel
         * @scope
         * @restrict E
         *
         * @description 
         * `customLabel` is a directive which creates a label element with transcluded text and
         * optional musted text within angle brackets. It is meant to be used for labeling a field
         * that involves an IRI in the muted text. The label element will be styled with the Bootstrap
         * 'control-label' class.
         *
         * @param {string} [mutedText=''] text to be displayed as muted within angle brackets after the
         * transcluded content.
         *
         * @usage
         * <!-- Without muted text -->
         * <custom-label>My custom label</custom-label>
         *
         * <!-- With muted text -->
         * <custom-label muted-text="'http://matonto.org'">My custom label</custom-label>
         */
        .directive('customLabel', customLabel);

        function customLabel() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    mutedText: '='
                },
                templateUrl: 'directives/customLabel/customLabel.html'
            }
        }
})();
