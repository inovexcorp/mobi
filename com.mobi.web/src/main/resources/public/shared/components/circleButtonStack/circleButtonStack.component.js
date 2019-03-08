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
     * @name shared.component:circleButtonStack
     * 
     * @description
     * `circleButtonStack` is a component that creates a Bootstrap circle button (`button.btn-float`) which reveals
     * transcluded content on hover. The transcluded content is expected to be a series of circle buttons with icons
     * inside that perform a variety of actions on click. The expectation is that the last button in the stack will be
     * "normal" size and the other will be sized smaller with the Bootstrap `btn-sm` class.Best practice is to also use
     * a {@link shared.directive:buttonHoverText} on each button to provide context as to what the button will do.
     * 
     * @usage
     * <circle-button-stack>
     *     <button class="btn btn-float btn-success btn-sm" button-hover-text="Secondray Action"></button>
     *     <button class="btn btn-float btn-primary" button-hover-text="Main Action"></button>
     * </circle-button-stack>
     */
    const circleButtonStackComponent = {
        templateUrl: 'shared/components/circleButtonStack/circleButtonStack.component.html',
        transclude: true,
        bindings: {},
        controllerAs: 'dvm',
        controller: circleButtonStackComponentCtrl
    };

    function circleButtonStackComponentCtrl() {}

    angular.module('shared')
        .component('circleButtonStack', circleButtonStackComponent);
})();
