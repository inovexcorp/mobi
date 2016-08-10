/*-
 * #%L
 * org.matonto.web
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
         * @name userInformationPage
         *
         * @description 
         * The `userInformationPage` module only provides the `userInformationPage` directive which 
         * creates a "page" for editing information of the currently ogged in user.
         */
        .module('userInformationPage', [])
        /**
         * @ngdoc directive
         * @name userInformationPage.directive:userInformationPage
         * @scope
         * @restrict E
         *
         * @description
         * `userInformationPage` is a directive that creates a div that will hold a form to 
         * edit the information of the currently logged in user. Currently it simply provides a 
         * welcome message to the user. The directive is replaced by the content of its template.
         */
        .directive('userInformationPage', userInformationPage);

        userInformationPage.$inject = ['userManagerService', 'loginManagerService'];

        function userInformationPage(userManagerService, loginManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.um = userManagerService;
                    dvm.lm = loginManagerService;
                    dvm.currentUser = _.find(dvm.um.users, {username: dvm.lm.currentUser});
                },
                templateUrl: 'modules/settings/directives/userInformationPage/userInformationPage.html'
            }
        }
})();