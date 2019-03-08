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
     * @name shared.component:infoMessage
     *
     * @description
     * `infoMessage` is a component that creates a styled message for displaying informative messages from the
     * transcluded content. The content will have blue colored text and will be next to an (i) icon.
     */
    const infoMessageComponent = {
        templateUrl: 'shared/components/infoMessage/infoMessage.component.html',
        transclude: true,
        bindings: {},
        controllerAs: 'dvm',
        controller: infoMessageComponentCtrl
    };

    function infoMessageComponentCtrl() {}

    angular.module('shared')
        .component('infoMessage', infoMessageComponent);
})();
