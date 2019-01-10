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

    /**
     * @ngdoc component
     * @name catalog.component:recordCard
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `recordCard` is a component which creates a 
     */
    const recordCardComponent = {
        templateUrl: 'modules/catalog/components/recordCard/recordCard.html',
        bindings: {
            record: '<',
            clickCard: '&'
        },
        controllerAs: 'dvm',
        controller: recordCardComponentCtrl
    };

    recordCardComponentCtrl.$inject = ['utilService'];

    function recordCardComponentCtrl(utilService) {
        var dvm = this;
        var util = utilService;
        dvm.descriptionLimit = 200;
        dvm.title = '';
        dvm.description = '';
        dvm.modified = '';

        dvm.$onInit = function() {
            dvm.title = util.getDctermsValue(dvm.record, 'title');
            dvm.description = util.getDctermsValue(dvm.record, 'description') || '(No description)';
            dvm.modified = util.getDate(util.getDctermsValue(dvm.record, 'modified'), 'short');
        }
    }

    angular.module('catalog')
        .component('recordCard', recordCardComponent);
})();
