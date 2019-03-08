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
     * @name shared.component:blockContent
     *
     * @description
     * `blockContent` is a component that creates a styled container for the body of a {@link shared.component:block}.
     * The container is styled to take of the remaining height of the `block` and vertically scroll.
     */
    const blockContentComponent = {
        templateUrl: 'shared/components/blockContent/blockContent.component.html',
        transclude: true,
        require: '^^block',
        bindings: {},
        controllerAs: 'dvm',
        controller: blockContentComponentCtrl
    };

    function blockContentComponentCtrl() {}

    angular.module('shared')
        .component('blockContent', blockContentComponent);
})();
