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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:stepProgressBar
     *
     * @description
     * `stepProgressBar` is a component that creates a Bootstrap stepper for indicating the progress through a series of
     * steps. The number of steps is set by the `stepNumber` attribute the current step (0 based) is indicated by the
     * `currentStep` attribuete.
     * 
     * @param {number} stepNumber The number of steps for this stepper
     * @param {number} currentStep The 0-based index of the current step
     */
    const stepProgressBarComponent = {
        templateUrl: 'shared/components/stepProgressBar/stepProgressBar.component.html',
        bindings: {
            stepNumber: '<',
            currentStep: '<'
        },
        controllerAs: 'dvm',
        controller: stepProgressBarComponentCtrl
    };

    function stepProgressBarComponentCtrl() {
        var dvm = this;

        dvm.getRange = function() {
            return _.range(0, dvm.stepNumber);
        }
    }

    angular.module('shared')
        .component('stepProgressBar', stepProgressBarComponent);
})();
