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
     * @name merge-requests.component:mergeRequestList
     * @requires shared.service:mergeRequestsStateService
     * @requires shared.service:modalService
     *
     * @description
     * `mergeRequestList` is a component which creates a div containing a {@link shared.component:block}
     * with the list of MergeRequests retrieved by the
     * {@link shared.service:mergeRequestsStateService}. The component houses the method for opening a
     * modal for deleting merge requests.
     */
    const mergeRequestListComponent = {
        templateUrl: 'merge-requests/components/mergeRequestList/mergeRequestList.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: mergeRequestListComponentCtrl
    };

    mergeRequestListComponent.$inject = ['mergeRequestsStateService', 'modalService'];

    function mergeRequestListComponentCtrl(mergeRequestsStateService, modalService) {
        var dvm = this;
        dvm.filterOptions = [
            {value: false, label: 'Open'},
            {value: true, label: 'Accepted'}
        ];
        dvm.state = mergeRequestsStateService;

        dvm.$onInit = function() {
            dvm.state.setRequests(dvm.state.acceptedFilter);
        }
        dvm.showDeleteOverlay = function(request, event) {
            event.stopPropagation();
            modalService.openConfirmModal('<p>Are you sure you want to delete ' + request.title + '?</p>', () => dvm.state.deleteRequest(request));
        }
    }

    angular.module('merge-requests')
        .component('mergeRequestList', mergeRequestListComponent);
})();