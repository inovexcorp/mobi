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
     * @name shared.component:materialTab
     *
     * @description
     * `materialTab` is a component that creates a `div` containing transluded content. It is meant to be used as a
     * child of the {@link shared.component:materialTabset} component. The data provided on this component is used to
     * populate behavior in the headers generated in the `materialTabset`. This includes whether the tab is active, the
     * heading text, whether the tab should be hidden, and the click behavior.
     * 
     * @param {boolean} active Whether the tab is active
     * @param {Function} setActive A function to set the value of the `active` parameter
     * @param {boolean} hideTab Whether the tab should be hidden from the tab headings in `materialTabset`
     * @param {string} heading Text for the heading of the tab in `materialTabset`
     * @param {Function} onClick An optional function to be called when the tab is clicked
     */
    const materialTabComponent = {
        templateUrl: 'shared/components/materialTab/materialTab.component.html',
        transclude: true,
        require: {
            tabset: '^^materialTabset'
        },
        bindings: {
            active: '<',
            setActive: '&',
            hideTab: '<?',
            heading: '<',
            onClick: '&'
        },
        controllerAs: 'dvm',
        controller: materialTabComponentCtrl
    };

    function materialTabComponentCtrl() {
        var dvm = this;

        dvm.$onInit = function() {
            dvm.tabset.addTab(this);
        }
        dvm.$onDestroy = function() {
            dvm.tabset.removeTab(this);
        }
    }

    angular.module('shared')
        .component('materialTab', materialTabComponent);
})();
