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
     * @name shared.component:statementContainer
     *
     * @description
     * `statementContainer` is a component that creates a display of
     * {@link shared.component:statementDisplay statements}, assumedly from a commit revision. If the component has the
     * `additions` attribute, the container will have an "Additions" title and the statements will be green. If the
     * component has the `deletions` attribute, the container will have a "Deletions" title and the statements will be
     * red.
     * 
     * @param {string} additions Whether the statements are additions. The presence of the attribute is enough to set it
     * @param {string} deletions Whether the statements are deletions. The presence of the attribute is enough to set it
     */
    const statementContainerComponent = {
        templateUrl: 'shared/components/statementContainer/statementContainer.component.html',
        transclude: true,
        bindings: {
            additions: '@',
            deletions: '@'
        },
        controllerAs: 'dvm',
        controller: statementContainerComponentCtrl
    };

    function statementContainerComponentCtrl() {
        var dvm = this;

        dvm.$onInit = function() {
            dvm.hasAdditions = dvm.additions !== undefined;
            dvm.hasDeletions = dvm.deletions !== undefined;
        }
    }

    angular.module('shared')
        .component('statementContainer', statementContainerComponent);

})();
