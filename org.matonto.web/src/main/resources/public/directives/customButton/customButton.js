(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name customButton
         *
         * @description
         * The `customButton` module only provides the `customButton` directive which creates
         * a Bootstrap styled button floated left or right with custom click handling, transcluded 
         * content, and disabled state.
         */
        .module('customButton', [])
        /**
         * @ngdoc directive
         * @name customButton.directive:customButton
         * @scope
         * @restrict E
         *
         * @description 
         * `customButton` is a directive that creates a Bootstrap styled button floated left or right 
         * with custom click handling, transcluded content, and disabled state. The button is styled as
         * 'primary' and floated right by default. It can be disabled under a specified condition and
         * have a custom click handler. The content of the button is transcluded so it can contain 
         * whatever is put between the opening and closing tags.
         *
         * @param {string} [type='primary'] the type of Bootstrap button style to apply. If 'primary', 
         * the 'btn-primary' class will be applied. If 'secondary', the 'btn-default' class will be applied.
         * @param {boolean} [isDisabledWhen=false] the condition that specifies when the button should be disabled.
         * If nothing is given, the button will always be enabled.
         * @param {function} onClick the function to be called when the button is clicked
         * @param {stirng} [pull='right'] the direction to float the button. If 'right', the 'pull-right'
         * class will be applied. If 'left', the 'pull-left' class will be applied.
         *
         * @usage
         * <!-- With defaults -->
         * <custom-button on-click="console.log('click')">Test</custom-button>
         *
         * <!-- With all parameters set -->
         * <custom-button on-click="console.log('click')" 
         *     type="'secondary'" 
         *     pull="'left'"
         *     is-disabled-when="true">
         *     Test
         * </custom-button>
         */
        .directive('customButton', customButton);

        function customButton() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    type: '=',
                    isDisabledWhen: '=',
                    onClick: '&',
                    pull: '='
                },
                templateUrl: 'directives/customButton/customButton.html',
                controller: ['$scope', function($scope) {
                    $scope.type = angular.isDefined($scope.type) ? $scope.type : 'primary';
                    $scope.pull = angular.isDefined($scope.pull) ? $scope.pull : 'right';
                }]
            }
        }
})();
