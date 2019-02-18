(function() {
    'use strict';

    function aDisabled() {
        return {
            restrict: 'A',
            link: function (scope, iElement, iAttrs) {
                iAttrs['ngClick'] = '!(' + iAttrs['aDisabled'] + ') && (' + iAttrs['ngClick'] + ')';
                scope.$watch(iAttrs['aDisabled'], function(newValue) {
                    if (newValue !== undefined) {
                        iElement.toggleClass('disabled', newValue);
                    }
                });
            },
        }
    }

    angular
        .module('aDisabled', [])
        .directive('aDisabled', aDisabled);
})();