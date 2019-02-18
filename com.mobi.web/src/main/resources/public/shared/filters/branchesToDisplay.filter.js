(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name branchesToDisplay
         *
         * @description
         * The `branchesToDisplay` module only provides the `branchesToDisplay` filter which filters an array of
         * branches to display the correct branches for that particular user. If a userBranch exists for that user, the
         * filter will display that branch as the normal branch. Additionally, the filter will hide other user branches
         * from users who did not create them.
         */
        .module('branchesToDisplay', [])
        /**
         * @ngdoc filter
         * @name branchesToDisplay.filter:branchesToDisplay
         * @kind function
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires loginManager.service:loginManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * Takes an array of branch objects and filters that array to to display the correct branches for the currently
         * logged in user. If a userBranch exists for that user, will display it as the normal branch. Additionally,
         * it will filter out any user branches that do not belong to the current user.
         *
         * @param {Object[]} branches The array of branches to filter
         * @returns {Object[]} an array of branches to display for the logged in user
         */
        .filter('branchesToDisplay', branchesToDisplay);

    branchesToDisplay.$inject = ['catalogManagerService', 'utilService', 'loginManagerService', 'prefixes'];

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
})();
