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
     * @name catalog.component:catalogRecordKeywords
     * @requires prefixes.service:prefixes
     *
     * @description
     * `catalogRecordKeywords` is a component which creates a div with Bootstrap `badge` spans for the keywords on the
     * provided catalog Record. The keywords will be sorted alphabetically.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     */
    const catalogRecordKeywordsComponent = {
        templateUrl: 'catalog/components/catalogRecordKeywords/catalogRecordKeywords.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: catalogRecordKeywordsComponentCtrl
    };

    catalogRecordKeywordsComponentCtrl.$inject = ['prefixes'];

    function catalogRecordKeywordsComponentCtrl(prefixes) {
        var dvm = this;
        dvm.keywords = [];

        dvm.$onInit = function() {
            dvm.keywords = getKeywords();
        }
        dvm.$onChanges = function() {
            dvm.keywords = getKeywords();
        }

        function getKeywords() {
            return _.map(_.get(dvm.record, prefixes.catalog + 'keyword', []), '@value').sort();
        }
    }

    angular.module('catalog')
        .component('catalogRecordKeywords', catalogRecordKeywordsComponent);
})();
