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
import './mergeRequestsPage.component.scss';

const template = require('./mergeRequestsPage.component.html');

/**
 * @ngdoc component
 * @name merge-requests.component:mergeRequestsPage
 * @requires shared.service:mergeRequestsStateService
 *
 * @description
 * `mergeRequestsPage` is a component which creates a div containing the main parts of the Merge Requests
 * tool. The main parts of the page are the {@link merge-requests.component:mergeRequestList},
 * {@link merge-requests.component:mergeRequestView}, and
 * {@link merge-requests.component:createRequest createRequest page}.
 */
const mergeRequestsPageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: mergeRequestsPageComponentCtrl
};

mergeRequestsPageComponentCtrl.$inject = ['mergeRequestsStateService'];

function mergeRequestsPageComponentCtrl(mergeRequestsStateService) {
    var dvm = this;
    dvm.state = mergeRequestsStateService;
}

export default mergeRequestsPageComponent;