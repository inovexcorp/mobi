(function() {
    'use strict';

    angular
        .module('filePreviewTable', [])
        .directive('filePreviewTable', filePreviewTable);

        function filePreviewTable($timeout) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    headers: '=',
                    rows: '=',
                    onClick: '&'
                },
                controller: function($scope, $element) {
                    var dvm = this;

                    dvm.big = false;
                    dvm.containerTop = '0px';
                    $timeout(function() {
                        dvm.initialHeight = $element[0].offsetHeight;
                        dvm.containerHeight = dvm.initialHeight + 'px';
                    });
                    
                    dvm.toggleTable = function() {
                        dvm.big = !dvm.big;
                        if (dvm.big) {
                            var top = $element[0].parentNode.offsetTop - $element[0].offsetTop;
                            var parentHeight = $element[0].parentNode.offsetHeight;
                            dvm.containerTop = `${top}px`;
                            dvm.containerHeight = `${parentHeight}px`;
                        } else {
                            dvm.containerTop = '0px';
                            dvm.containerHeight = dvm.initialHeight + 'px';
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/filePreviewTable/filePreviewTable.html'
            }
        }
})();
