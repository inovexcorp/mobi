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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name explore.component:classBlockHeader
     * @requires shared.service:discoverStateService
     * @requires discover.service:exploreService
     * @requires explore.service:exploreUtilsService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * HTML contents in the class block header which provides a dropdown select to allow users to
     * pick a dataset to determine what class details are to be shown on the page.
     */
    const classBlockHeaderComponent = {
        templateUrl: 'discover/explore/components/classBlockHeader/classBlockHeader.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: classBlockHeaderComponentCtrl
    };

    classBlockHeaderComponent.$inject = ['discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'modalService'];

    function classBlockHeaderComponentCtrl(discoverStateService, exploreService, exploreUtilsService, utilService, modalService) {
        var dvm = this;
        var es = exploreService;
        var util = utilService;
        dvm.ds = discoverStateService;
        dvm.eu = exploreUtilsService;
        
        dvm.showCreate = function() {
            dvm.eu.getClasses(dvm.ds.explore.recordId)
                .then(classes => {
                    modalService.openModal('newInstanceClassOverlay', {classes});
                }, util.createErrorToast);
        }
        dvm.onSelect = function() {
            es.getClassDetails(dvm.ds.explore.recordId)
                .then(details => {
                    dvm.ds.explore.classDetails = details;
                }, errorMessage => {
                    dvm.ds.explore.classDetails = [];
                    util.createErrorToast(errorMessage);
                });
        }
    }

    angular.module('explore')
        .component('classBlockHeader', classBlockHeaderComponent);
})();