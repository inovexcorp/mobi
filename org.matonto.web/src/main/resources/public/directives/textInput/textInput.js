(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name textInput
         * @requires  customLabel
         *
         * @description 
         * The `textInput` module only provides the `textInput` directive which creates
         * a text input field with a customLabel and a custom on change function.
         */
        .module('textInput', ['customLabel'])
        /**
         * @ngdoc directive
         * @name textInput.directive:textInput
         * @scope
         * @restrict E
         *
         * @description 
         * `textInput` is a directive that creates a Bootstrap "form-group" div with a 
         * text input element and a customLabel. The text input is bound to the passed in
         * bindModel variable and can have a custom on change function.
         *
         * @param {*} bindModel The variable to bind the value of the text input field to
         * @param {function} changeEvent A function to be called when the value of the 
         * text input field changes
         * @param {string=''} displayText The text to be displayed in the customLabel
         * @param {string=''} mutedText The muted text to be displayed in the customLabel
         *
         * @usage
         * <!-- With defaults -->
         * <text-input ng-model="variableName" change-event="console.log('Change')"></text-input>
         *
         * <!-- With all params -->
         * <text-input ng-model="variableName" change-event="console.log('Change')" display-text="'Label text'" muted-text="'Muted text'"></text-input>
         */
        .directive('textInput', textInput);

        function textInput() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/textInput/textInput.html'
            }
        }
})();
