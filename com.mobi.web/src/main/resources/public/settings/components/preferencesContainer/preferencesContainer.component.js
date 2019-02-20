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
     * @name settings.component:preferencesContainer
     *
     * @description
     * `preferencesContainer` is a component that creates a section with transcluded content and a header. The main content
     * for the container is transcluded so it can contain whatever is put between the opening and closing tags. However, it
     * is expected that the content will be {@link settings.component:customPreference customPreference} components.
     *
     * @param {string} header the text to display in the section's header
     */
    const preferencesContainerComponent = {
        templateUrl: 'settings/components/preferencesContainer/preferencesContainer.component.html',
        transclude: true,
        bindings: {
            header: '<'
        },
        controllerAs: 'dvm',
        controller: preferencesContainerComponentCtrl
    };

    function preferencesContainerComponentCtrl() {
        var dvm = this;
    }

    angular.module('settings')
        .component('preferencesContainer', preferencesContainerComponent);
})();