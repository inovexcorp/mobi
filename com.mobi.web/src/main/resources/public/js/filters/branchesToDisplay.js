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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name branchesToDisplay
         *
         * @description
         * The `branchesToDisplay` module only provides the `branchesToDisplay` filter which filters an array of
         * branches to display the correct branches for that particular user. If a userBranch exists, will display
         * it as the normal branch.
         */
        .module('branchesToDisplay', [])
        /**
         * @ngdoc filter
         * @name branchesToDisplay.filter:branchesToDisplay
         * @kind function
         *
         * @description
         * Takes an array of branch objects and filters that array to to display the correct branches for that
         * particular user. If a userBranch exists for that user, will display it as the normal branch.
         * @param {*[]} branches The array of branches to filter
         * @param {*[]} userIRI The IRI of the currently logged in user
         * @param {*[]} os The ontologyStateService
         * @returns {*[]} an array of branches to display for the particular user
         */
        .filter('branchesToDisplay', branchesToDisplay);

    branchesToDisplay.$inject = ['ontologyStateService', 'utilService', 'loginManagerService', 'prefixes'];

    function branchesToDisplay(ontologyStateService, utilService, loginManagerService, prefixes) {
        return function(branches) {
            var createdFromIRIsToHide =[];
            var displayBranches = [];
            _.forEach(branches, function(branch) {
                var publisher = utilService.getDctermsId(branch, 'publisher');
                if (ontologyStateService.isUserBranch(branch) && loginManagerService.currentUserIRI === publisher) {
                    createdFromIRIsToHide.push(utilService.getPropertyId(branch, prefixes.catalog + 'createdFrom'));
                    displayBranches.push(branch);
                }
            });
            if (createdFromIRIsToHide) {
                _.forEach(branches, function(branch) {
                    if (!ontologyStateService.isUserBranch(branch) && !_.includes(createdFromIRIsToHide, branch['@id'])) {
                        displayBranches.push(branch);
                    }
                });
            } else {
                displayBranches = branches;
            }

            displayBranches.sort(function(a, b) {
                var aTitle = utilService.getDctermsValue(a, 'title');
                var bTitle = utilService.getDctermsValue(b, 'title');
                var master = 'MASTER';

                if (aTitle === master && bTitle === master) {
                    return 0;
                } else if (aTitle === master && bTitle !== master) {
                    return -1;
                } else if (aTitle !== master && bTitle === master) {
                    return 1;
                } else {
                    return aTitle.localeCompare(bTitle);
                }
            });
            
            return displayBranches;
        }
    }
})();
