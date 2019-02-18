(function() {
    'use strict';

    function keywordSelect() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'shared/directives/keywordSelect/keywordSelect.directive.html',
            scope: {},
            bindToController: {
                bindModel: '=ngModel'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.keywordList = [];
            }
        }
    }

    angular
        .module('keywordSelect', [])
        .directive('keywordSelect', keywordSelect);

})();
