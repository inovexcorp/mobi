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
     * @requires shared.service:prefixes
     *
     * @description
     * `catalogRecordKeywords` is a component which creates a div with Bootstrap `badge` spans for the keywords on the
     * provided catalog Record. The keywords will be sorted alphabetically. If the user is allowed to edit
     * the content, upon clicking the area it provides a {@link shared.directive:keywordSelect}. A save icon is provided
     * to call the supplied callback. When changes are made to the field and the area is blurred, the display is reset
     * to the initial state.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {boolean} canEdit A boolean indicating if the user can edit the keywords
     * @param {Function} saveEvent A function to call with the current updated record as a parameter when the save button is pressed
     */
    const catalogRecordKeywordsComponent = {
        templateUrl: 'catalog/components/catalogRecordKeywords/catalogRecordKeywords.component.html',
        bindings: {
            record: '<',
            canEdit: '<',
            saveEvent: '&'
        },
        controllerAs: 'dvm',
        controller: catalogRecordKeywordsComponentCtrl
    };

    catalogRecordKeywordsComponentCtrl.$inject = ['prefixes'];

    function catalogRecordKeywordsComponentCtrl(prefixes) {
        var dvm = this;
        dvm.keywords = [];
        dvm.initialKeywords = [];
        dvm.edit = false;

        dvm.$onInit = function() {
            dvm.keywords = getKeywords();
            dvm.initialKeywords = dvm.keywords;
        }
        dvm.$onChanges = function() {
            dvm.keywords = getKeywords();
            dvm.initialKeywords = dvm.keywords;
        }
        dvm.saveChanges = function() {
            dvm.edit = false;
            dvm.record[prefixes.catalog + 'keyword'] = _.map(dvm.keywords, keyword => ({'@value': keyword}));
            dvm.saveEvent({record: dvm.record});
        }
        dvm.cancelChanges = function() {
            dvm.keywords = dvm.initialKeywords;
            dvm.edit = false;
        }

        function getKeywords() {
            return _.map(_.get(dvm.record, prefixes.catalog + 'keyword', []), '@value').sort();
        }
    }

    angular.module('catalog')
        .component('catalogRecordKeywords', catalogRecordKeywordsComponent);
})();
