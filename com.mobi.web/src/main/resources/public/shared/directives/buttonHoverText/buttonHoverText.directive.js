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

    buttonHoverText.$inject = ['$compile'];

    /**
     * @ngdoc directive
     * @name shared.directive:buttonHoverText
     * @restrict A 
     * @requires $compile 
     * 
     * @description
     * `buttonHoverText` is a directive that adds popover text to the parent element that appears to the left on hover.
     * Expected to be used with buttons, specifically Bootstrap circle buttons (`button.btn-float`) and most commonly
     * in a {@link shared.component:circleButtonStack}.
     */
    function buttonHoverText($compile) {
        return {
            restrict: 'A',
            priority: 2000,
			terminal: true,
            link: function(scope, elem, attrs) {
                var text = attrs['buttonHoverText'];
                elem.removeAttr('button-hover-text');
                elem.attr('uib-popover', text);
                elem.attr('popover-placement', 'left');
                elem.attr('popover-trigger', "'mouseenter'");
                elem.attr('popover-class', 'button-hover-text');

                $compile(elem)(scope);
            }
        };
    }
    angular.module('shared')
        .directive('buttonHoverText', buttonHoverText)
})();