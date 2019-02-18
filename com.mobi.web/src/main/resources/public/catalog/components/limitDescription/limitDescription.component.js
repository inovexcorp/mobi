
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:limitDescription
     *
     * @description
     * `limitDescription` is a component which creates a span with the provided description string limited to a specific
     * number of characters (default is 200) and a button to toggle the full display.
     *
     * @param {string} description A string to be limited
     * @param {number} limit An optional number of characters to limit the description to (default is 200)
     */
    const limitDescriptionComponent = {
        templateUrl: 'catalog/components/limitDescription/limitDescription.component.html',
        bindings: {
            description: '<',
            limit: '<?'
        },
        controllerAs: 'dvm',
        controller: limitDescriptionComponentCtrl
    };

    function limitDescriptionComponentCtrl() {
        var dvm = this;
        dvm.full = false;
        dvm.display = '';

        dvm.$onInit = function() {
            dvm.descriptionLimit = dvm.limit || 200;
            dvm.display = getLimitedDescription();
        }
        dvm.$onChanges = function() {
            dvm.full = false;
            dvm.display = getLimitedDescription();
        }
        dvm.toggleFull = function() {
            dvm.full = !dvm.full;
            dvm.display = dvm.full ? dvm.description : getLimitedDescription();
        }

        function getLimitedDescription() {
            return _.truncate(dvm.description, {length: dvm.descriptionLimit});
        }
    }

    angular.module('catalog')
        .component('limitDescription', limitDescriptionComponent);
})();
