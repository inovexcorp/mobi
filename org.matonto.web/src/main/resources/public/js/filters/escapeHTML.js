(function() {
    'use strict';

    angular
        .module('escapeHTML', [])
        .filter('escapeHTML', escapeHTML);

    function escapeHTML() {
        return function(text) {
            if(text) {
                var node = document.createTextNode(text);
                var div = document.createElement('div');
                div.appendChild(node);
                return div.innerHTML;
            } else {
                return;
            }
        }
    }
})();