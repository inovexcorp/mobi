(function() {
    'use strict';

    function textInput() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                bindModel: '=ngModel',
                changeEvent: '&',
                displayText: '<',
                mutedText: '<',
                required: '<',
                inputName: '<',
                isInvalid: '<',
                isValid: '<',
                isFocusMe: '<?'
            },
            templateUrl: 'shared/directives/textInput/textInput.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name textInput
         *
         * @description
         * The `textInput` module only provides the `textInput` directive which creates a labeled text input field
         * and several optional customization variables.
         */
        .module('textInput', [])
        /**
         * @ngdoc directive
         * @name textInput.directive:textInput
         * @scope
         * @restrict E
         *
         * @description
         * `textInput` is a directive that creates a Bootstrap "form-group" div with a text input element and a
         * {@link customLabel.directive:customLabel customLabel}. The `customLabel` uses the provided `displayText` and
         * `mutedText` for display. The text input is bound to the passed `bindModel` variable. It can also have a
         * custom on change function. The name of the input is configurable along with whether it is required. The input
         * can optionally be focused on rendering as well. The `isInvalid` and `isValid` parameters provide a way to
         * change the styling based on the validity of the input. The directive is replaced by the contents of
         * its template.
         *
         * @param {*} bindModel The variable to bind the value of the text input field to
         * @param {Function} changeEvent A function to be called when the value of the
         * text input field changes
         * @param {string} [displayText=''] The text to be displayed in the customLabel
         * @param {string} [mutedText=''] The muted text to be displayed in the customLabel
         * @param {boolean} [required=false] Whether the text input should be required
         * @param {string} [inputName=''] The name to give the text input
         * @param {boolean} [isInvalid=false] Whether the text input is invalid
         * @param {boolean} [isValid=false] Whether the text input is valid
         * @param {boolean} isFocusMe Whether the text input should be focused once rendered
         */
        .directive('textInput', textInput);
})();
