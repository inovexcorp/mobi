/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
