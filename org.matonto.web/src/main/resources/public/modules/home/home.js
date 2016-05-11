(function() {
    'use strict';

    angular
        .module('home', ['moduleBox'])
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$timeout'];

    function HomeController($timeout) {
        $timeout(function() {
            var boxes = document.querySelectorAll('.module-box .content');
            var maxHeight = 0;

            _.forEach(boxes, function(box) {
                if(box.clientHeight > maxHeight) {
                    maxHeight = box.clientHeight;
                }
            });

            angular.element(boxes).attr('style', 'height: ' + maxHeight + 'px');
        });
    }
})();
