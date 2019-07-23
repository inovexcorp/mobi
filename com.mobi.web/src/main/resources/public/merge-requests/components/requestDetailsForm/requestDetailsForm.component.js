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
     * @name merge-requests.component:requestDetailsForm
     * @requires shared.service:mergeRequestsStateService
     * @requires shared.service:utilService
     *
     * @description
     * `requestDetailsForm` is a component which creates a div containing a form with inputs for
     * the title, description, and other metadata about a new MergeRequest. The div also contains
     * {@link shared.component:commitDifferenceTabset} to display the changes and
     * commits between the previously selected source and target branch of the Merge Request.
     */
    const requestDetailsFormComponent = {
        templateUrl: 'merge-requests/components/requestDetailsForm/requestDetailsForm.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: requestDetailsFormComponentCtrl
    }

    requestDetailsFormComponent.$inject = ['mergeRequestsStateService', 'userManagerService', 'utilService', 'prefixes'];

    function requestDetailsFormComponentCtrl(mergeRequestsStateService, userManagerService, utilService, prefixes) {
        var dvm = this;
        dvm.util = utilService;
        dvm.prefixes = prefixes;
        dvm.state = mergeRequestsStateService;
        dvm.um = userManagerService;

        dvm.$onInit = function() {
            dvm.state.requestConfig.title = dvm.util.getDctermsValue(dvm.state.requestConfig.sourceBranch, 'title');
        }
    }

    angular.module('merge-requests')
        .component('requestDetailsForm', requestDetailsFormComponent);
})();