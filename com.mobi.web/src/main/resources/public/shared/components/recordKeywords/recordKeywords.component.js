/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name shared.component:recordKeywords
     * @requires shared.service:prefixes
     *
     * @description
     * `recordKeywords` is a component that creates a div containing a display of all the keyword property
     * values of the pased JSON-LD record object.
     *
     * @param {Object} record The JSON-LD object for a record
     */
    const recordKeywordsComponent = {
        templateUrl: 'shared/components/recordKeywords/recordKeywords.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordKeywordsComponentCtrl
    };

    recordKeywordsComponentCtrl.$inject = ['prefixes'];

    function recordKeywordsComponentCtrl(prefixes) {
        var dvm = this;

        dvm.getKeywords = function() {
            return _.map(_.get(dvm.record, prefixes.catalog + 'keyword', []), '@value').sort();
        }
    }

    angular.module('shared')
        .component('recordKeywords', recordKeywordsComponent);
})();
