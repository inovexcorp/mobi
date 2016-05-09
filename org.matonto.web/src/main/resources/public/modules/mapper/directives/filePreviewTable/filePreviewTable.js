(function() {
    'use strict';

    angular
        .module('filePreviewTable', [])
        .directive('filePreviewTable', filePreviewTable);

        function filePreviewTable() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    headers: '=',
                    rows: '=',
                    mappedColumns: '=',
                    highlightIdx: '=',
                    isClickable: '=',
                    onClick: '&'
                },
                link: function(scope, elem, attrs, ctrl) {
                    ["transitionend","webkitTransitionEnd","mozTransitionEnd"].forEach(function(transitionEnd) {
                        elem[0].addEventListener(transitionEnd, function() {
                            if (ctrl.big) {
                                ctrl.showNum = scope.rows.length;
                                ctrl.small = false;
                                scope.$digest();
                            }
                        });
                    });
                },
                controller: function() {
                    var dvm = this;
                    dvm.big = false;
                    dvm.small = true;
                    dvm.showNum = 5;

                    dvm.toggleTable = function() {
                        dvm.big = !dvm.big;
                        if (!dvm.big) {
                            dvm.showNum = 5;
                            dvm.small = true;
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/filePreviewTable/filePreviewTable.html'
            }
        }
})();
