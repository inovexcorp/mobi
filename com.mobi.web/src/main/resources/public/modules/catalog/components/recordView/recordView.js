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
     * @name catalog.component:recordView
     * @requires catalogState.service:cataStateService
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     * @requires userManager.service:userManagerService
     *
     * @description
     * `recordView` is a component which creates a div with a Bootstrap `row` containing columns displaying different
     * information about the currently {@link catalogState.service:catalogStateService selected catalog Record}. The
     * first column just contains a button to go back to the {@link catalog.component:catalogPage}. The second column
     * contains a display of the Record's title, description, and {@link catalog.component:recordIcon icon} along with a
     * {@link catalog.component:recordViewTabset}. The third column contains the Record's publisher, modified date,
     * issued date, and keywords. On initialization of the component, it will re-retrieve the Record to ensure that it
     * still exists.
     */
    const recordViewComponent = {
        templateUrl: 'modules/catalog/components/recordView/recordView.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: recordViewComponentCtrl
    };

    recordViewComponentCtrl.$inject = ['catalogStateService', 'catalogManagerService', 'utilService', 'prefixes', 'userManagerService'];

    function recordViewComponentCtrl(catalogStateService, catalogManagerService, utilService, prefixes, userManagerService) {
        var dvm = this;
        var state = catalogStateService;
        var cm = catalogManagerService;
        var util = utilService;
        var um = userManagerService;
        dvm.record = undefined;
        dvm.title = '';
        dvm.description = '';
        dvm.publisherName = '';
        dvm.modified = '';
        dvm.issued = '';
        dvm.keywords = [];

        dvm.$onInit = function() {
            cm.getRecord(state.selectedRecord['@id'], util.getPropertyId(state.selectedRecord, prefixes.catalog + 'catalog'))
                .then(response => {
                    dvm.record = response;
                    dvm.title = util.getDctermsValue(dvm.record, 'title');
                    dvm.description = util.getDctermsValue(dvm.record, 'description');
                    var publisherId = util.getDctermsId(dvm.record, 'publisher');
                    dvm.publisherName = publisherId ? _.get(_.find(um.users, {iri: publisherId}), 'username', '(None)') : '(None)';
                    dvm.modified = util.getDate(util.getDctermsValue(dvm.record, 'modified'), 'short');
                    dvm.issued = util.getDate(util.getDctermsValue(dvm.record, 'issued'), 'short');
                    dvm.keywords = _.map(_.get(dvm.record, prefixes.catalog + 'keyword', []), '@value').sort();
                }, () => {
                    util.createWarningToast('The record you were viewing no longer exists');
                    state.selectedRecord = undefined;
                });
        }
        dvm.goBack = function() {
            state.selectedRecord = undefined;
        }
    }

    angular.module('catalog')
        .component('recordView', recordViewComponent);
})();
