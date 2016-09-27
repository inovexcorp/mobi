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
         * @name settingsPages
         *
         * @description 
         * The `settingsPages` module only provides the `settingsPages` directive which creates 
         * a container for all pages for the settings module.
         */
        .module('settingsPages', [])
        /**
         * @ngdoc directive
         * @name settingsPages.directive:settingsPages
         * @scope
         * @restrict E
         *
         * @description
         * `settingsPages` is a directive that creates a div styled as a Bootstrap "row" with 
         * all pages for the settings module. These pages are
         * {@link settingsPage.directive:settingsPage settingsPage}, 
         * {@link userInformationPage.directive:userInformationPage userInformationPage}, and
         * {@link changePasswordPage.directive:changePasswordPage changePasswordPage}.
         * The directive is replaced by the content of its template.
         */
        .directive('settingsPages', settingsPages);

        settingsPages.$inject = ['settingsStateService'];

        function settingsPages(settingsStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = settingsStateService;
                },
                templateUrl: 'modules/settings/directives/settingsPages/settingsPages.html'
            }
        }
})();