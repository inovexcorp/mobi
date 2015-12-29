/**
 * @desc custom widget directive which will pull data from a web app URL
 * @example <div custom-widget></div>
 */

(function() {
    'use strict';

    angular
        .module('widget', [])
        .directive('customWidget', customWidget);

        customWidget.$inject = ['$document'];

        function customWidget($document) {
            var directive = {
                restrict: 'EA',
                link: link,
                templateUrl: '/modules/webtop/directives/custom-widget/custom-widget.html',
                controller: CustomWidgetController,
                controllerAs: 'vm',
                bindToController: true,
                scope: {
                    src: '='
                }
            }
            return directive;

            function link(scope, el, attr, ctrl) {
                var offset = {left: el.offsetLeft, top: el.offsetTop},
                    isDown = false;

                /* Gets the toolbar div */
                /* NOTE: If you change the structure and add more divs, this will break */
                el.find('div').on('mousedown', function(e) {
                    isDown = true;
                    offset = {
                        left: el.css('left').replace('px', '') - e.clientX,
                        top: el.css('top').replace('px', '') - e.clientY
                    }
                });

                $document.on('mouseup', function(e) {
                    isDown = false;
                });

                $document.on('mousemove', function(e) {
                    e.preventDefault();
                    if(isDown) {
                        el.css({
                            left: (e.clientX + offset.left) + 'px',
                            top: (e.clientY + offset.top) + 'px'
                        });
                    }
                });
            }
        }

        function CustomWidgetController() {
            var vm = this;
        }
})();