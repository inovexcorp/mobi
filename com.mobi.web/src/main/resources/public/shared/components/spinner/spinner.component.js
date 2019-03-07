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
     * @name shared.component:spinner
     *
     * @description
     * `spinner` is a component that creates a spinning icon with a transparent background that fills the containing
     * element. Spinner size is controller by the scope variable `diameter`.
     * 
     * @param {number} [diameter=50] The pixel diameter of the spinner
     */
    const spinnerComponent = {
        template: '<div class="spinner"><div class="icon-wrapper"><md-progress-circular md-mode="indeterminate" md-diameter="{{dvm.dia}}"></md-progress-circular></div></div>',
        bindings: {
            diameter: '<?'
        },
        controllerAs: 'dvm',
        controller: spinnerComponentCtrl
    };

    function spinnerComponentCtrl() {
        var dvm = this;

        dvm.$onInit = function() {
            dvm.dia = dvm.diameter || 50;
        }
    }

    angular.module('shared')
        .component('spinner', spinnerComponent);
})();