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
         * @name confirmationOverlay
         *
         * @description
         * The `confirmationOverlay` module only provides the `confirmationOverlay` directive
         * which creates an overlay with transcluded content and customizable confirm and cancel
         * buttons.
         */
        .module('confirmationOverlay', [])
        /**
         * @ngdoc directive
         * @name  confirmationOverlay.directive:confirmationOverlay
         * @scope
         * @restrict E
         *
         * @description
         * `confirmationOverlay` is a directive that creates an overlay with transcluded content and
         * buttons to confirm or cancel. The text for the buttons are customizable as well as the functions
         * called when they are clicked. The cancel button will be on the left and the confirm button will be
         * on the right. The main content for the overlay is transcluded so it can contain whatever is put
         * between the opening and closing tags. The size of the overlay can be set to 'small', or 'large'.
         *
         * @param {string} cancelText the text to display on the lefthand cancel button
         * @param {function} cancelClick the function to call when the cancel button is clicked
         * @param {string} confirmText the test to display on the righthand confirm button
         * @param {function} confirmClick the function to call when the confirm button is clicked
         * @param {string} headerText the text to display in the header of the overlay
         * @param {string} [size=''] the size of the overlay, 'small' or 'large'. If none is set, it will be an
         * in-between size
         */
        .directive('confirmationOverlay', confirmationOverlay);

        function confirmationOverlay() {
            return {
                restrict: 'E',
                transclude: true,
                replace: true,
                scope: {
                    cancelText: '=?',
                    cancelClick: '&',
                    confirmText: '=?',
                    confirmClick: '&',
                    headerText: '=',
                    size: '='
                },
                templateUrl: 'directives/confirmationOverlay/confirmationOverlay.html'
            }
        }
})();
