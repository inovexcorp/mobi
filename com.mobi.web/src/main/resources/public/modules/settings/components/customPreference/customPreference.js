/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
/**
 * @ngdoc component
 * @name customPreference.component:customPreference
 *
 * @description
 * `customPreference` is a component that creates an article with transcluded content, a header, and a question
 * representing what the setting is for. The main content for the overlay is transcluded so it can contain whatever is
 * put between the opening and closing tags.
 *
 * @param {string} header the text to display in the article's header
 * @param {string} question the text to display as the setting's representative question
 */
const customPreferenceComponent = {
    templateUrl: 'modules/settings/components/customPreference/customPreference.html',
    transclude: true,
    bindings: {
        header: '<',
        question: '<'
    },
    controllerAs: 'dvm',
    controller: customPreferenceComponentCtrl
}

function customPreferenceComponentCtrl() {
    var dvm = this;
}

angular.module('settings')
    .component('customPreference', customPreferenceComponent);
