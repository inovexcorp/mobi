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
     * @name mapper.component:mappingCommitsPage
     * @requires shared.service:mapperStateService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `mappingCommitsPage` is a component that creates a Bootstrap `row` with a {@link shared.component:block} for
     * viewing the {@link shared.component:commitHistoryTable commit history} of the current
     * {@link shared.service:mapperStateService mapping}.
     */
    const mappingCommitsPageComponent = {
        templateUrl: 'mapper/components/mappingCommitsPage/mappingCommitsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: mappingCommitsPageComponentCtrl
    };

    mappingCommitsPageComponentCtrl.$inject = ['mapperStateService', 'utilService', 'prefixes'];

    function mappingCommitsPageComponentCtrl(mapperStateService, utilService, prefixes) {
        var dvm = this;
        var util = utilService;
        var state = mapperStateService;
        dvm.commitId = '';
        dvm.branchTitle = '';

        dvm.$onInit = function() {
            if (!state.mapping.branch && !state.newMapping) {
                state.setMasterBranch().then(() => {
                    dvm.commitId = util.getPropertyId(state.mapping.branch, prefixes.catalog + 'head');
                    dvm.branchTitle = util.getDctermsValue(state.mapping.branch, 'title');
                });
            }
        }
    }

    angular.module('mapper')
        .component('mappingCommitsPage', mappingCommitsPageComponent);
})();