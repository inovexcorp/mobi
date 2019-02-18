(function () {
    'use strict';

    recordKeywords.$inject = ['prefixes'];

    function recordKeywords(prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                record: '<'
            },
            controller: function() {
                var dvm = this;

                dvm.getKeywords = function(record) {
                    return _.map(_.get(record, prefixes.catalog + 'keyword', []), '@value').sort();
                }
            },
            templateUrl: 'shared/directives/recordKeywords/recordKeywords.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name recordKeywords
         * @requires catalogManager
         *
         * @description
         * The `recordKeywords` module only provides the `recordKeywords` directive which creates a div with
         * a display of all the keywords in the passed record JSON-LD object.
         */
        .module('recordKeywords', [])
        /**
         * @ngdoc directive
         * @name recordKeywords.directive:recordKeywords
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         *
         * @description
         * `recordKeywords` is a directive that creates a div containing a display of all the keyword property
         * values of the pased JSON-LD record object. The directive is replaced with the content of the template.
         *
         * @param {Object} record The JSON-LD object for a record
         */
        .directive('recordKeywords', recordKeywords);
})();
