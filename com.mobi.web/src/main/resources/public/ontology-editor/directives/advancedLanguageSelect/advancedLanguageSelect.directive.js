(function() {
    'use strict';

    angular
        .module('advancedLanguageSelect', [])
        .directive('advancedLanguageSelect', advancedLanguageSelect);

        function advancedLanguageSelect() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/advancedLanguageSelect/advancedLanguageSelect.directive.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.isShown = false;

                    dvm.show = function() {
                        dvm.isShown = true;
                        dvm.bindModel = 'en';
                    }

                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.bindModel = undefined;
                    }
                }
            }
        }
})();
