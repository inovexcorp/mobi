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

    branchesToDisplay.$inject = ['catalogManagerService', 'utilService', 'loginManagerService', 'prefixes'];

    /**
     * @ngdoc filter
     * @name shared.filter:branchesToDisplay
     * @kind function
     * @requires shared.service:catalogManagerService
     * @requires shared.service:utilService
     * @requires shared.service:loginManagerService
     * @requires shared.service:prefixes
     *
     * @description
     * Takes an array of branch objects and filters that array to to display the correct branches for the currently
     * logged in user. If a userBranch exists for that user, will display it as the normal branch. Additionally,
     * it will filter out any user branches that do not belong to the current user.
     *
     * @param {Object[]} branches The array of branches to filter
     * @returns {Object[]} an array of branches to display for the logged in user
     */
    function branchesToDisplay(catalogManagerService, utilService, loginManagerService, prefixes) {
        var cm = catalogManagerService;
        var util = utilService;
        var lm = loginManagerService;
        return function(branches) {
            var displayBranches = _.filter(branches, branch => !cm.isBranch(branch));
            var myUserBranches = _.filter(branches, branch => cm.isUserBranch(branch) && lm.currentUserIRI === util.getDctermsId(branch, 'publisher'));
            if (myUserBranches.length) {
                var toHide = _.map(myUserBranches, branch => util.getPropertyId(branch, prefixes.catalog + 'createdFrom'));
                var moreBranches = _.filter(branches, branch => !cm.isUserBranch(branch) && !_.includes(toHide, branch['@id']));
                displayBranches = _.concat(moreBranches, myUserBranches);
            } else {
                displayBranches = _.reject(branches, cm.isUserBranch);
            }

            var masterBranchArr = _.remove(displayBranches, branch => util.getDctermsValue(branch, 'title') === 'MASTER');
            return _.concat(masterBranchArr, _.sortBy(displayBranches, branch => util.getDctermsValue(branch, 'title')));
        }
    }

    angular.module('shared')
        .filter('branchesToDisplay', branchesToDisplay);
})();
