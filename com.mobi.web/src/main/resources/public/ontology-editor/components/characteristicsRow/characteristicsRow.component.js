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
     * @name ontology-editor.component:characteristicsRow
     * @requires shared.service:prefixes
     * @requires shared.service:ontologyStateService
     * @requires shared.service:ontologyManagerService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `characteristicsRow` is a component that creates a Bootstrap `.row` that displays the
     * {@link ontology-editor.component:characteristicsBlock} depending on whether the
     * {@link shared.service:ontologyStateService selected entity} is a object or data property.
     */
    const characteristicsRowComponent = {
        templateUrl: 'ontology-editor/components/characteristicsRow/characteristicsRow.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: characteristicsRowComponentCtrl
    };

    characteristicsRowComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService'];

    function characteristicsRowComponentCtrl(ontologyManagerService, ontologyStateService) {
        var dvm = this;
        dvm.om = ontologyManagerService;
        dvm.os = ontologyStateService;
    }

    angular.module('ontology-editor')
        .component('characteristicsRow', characteristicsRowComponent);
})();
