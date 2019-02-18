(function() {
    'use strict';

    function textArea() {
        return {
            restrict: 'E',
            scope: {
                bindModel: '=ngModel',
                changeEvent: '&',
                displayText: '<',
                mutedText: '<',
                required: '<',
                textAreaName: '<',
                isFocusMe: '<?'
            },
            templateUrl: 'shared/directives/textArea/textArea.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name textArea
         *
         * @description
         * The `textArea` module only provides the `textArea` directive which creates a labeled textarea input.
         */
        .module('textArea', [])
        /**
         * @ngdoc directive
         * @name textArea.directive:textArea
         * @scope
         * @restrict E
         *
         * @description
         * `textArea` is a directive which creates a Bootstrap "form-group" div with a textarea element and a
         * {@link customLabel.directive:customLabel}. The `customLabel` uses the provided `displayText` and `mutedText`
         * for display. The textarea is bound to the passed in `bindModel` variable. It can also have a custom on change
         * function. The name of the textarea input is configurable along with whether it is required. The textarea can
         * optionally be focused on rendering as well.
         *
         * @param {*} bindModel The variable to bind the value of the textarea to
         * @param {Function} changeEvent A function to be called when the value of the
         * textarea changes
         * @param {string} [displayText=''] The text to be displayed in the `customLabel`
         * @param {string} [mutedText=''] The muted text to be displayed in the `customLabel`
         * @param {boolean} [required=false] Whether the textarea is required
         * @param {string} textAreaName The name of the textarea input
         * @param {boolean} Whether the textarea should be focused once rendered
         */
        .directive('textArea', textArea);
})();
