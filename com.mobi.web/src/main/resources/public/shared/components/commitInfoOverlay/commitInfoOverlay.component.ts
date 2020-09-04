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

import { get } from 'lodash';

const template = require('./commitInfoOverlay.component.html');

/**
 * @ngdoc component
 * @name shared.component:commitInfoOverlay
 * @requires shared.service:utilService
 * @requires shared.service:userManagerService
 * @requires shared.service:catalogManagerService
 *
 * @description
 * `commitInfoOverlay` is a component that creates content for a modal displaying information about the passed
 * commit object including a {@link shared.component:commitChangesDisplay commit changes display} of the passed
 * additions and deletions for the commit. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Object} resolve Information provided to the modal
 * @param {Function} resolve.entityNameFunc An optional function to pass to `commitChangesDisplay` to control the
 * display of each entity's name
 * @param {Object} resolve.commit The commit to display information about
 * @param {string} resolve.commit.id The IRI string identifying the commit
 * @param {string} resolve.commit.message The message associated with the commit
 * @param {Object} resolve commit.creator An object containing information about the creator of the commit,
 * including the username, first name, and last name
 * @param {string} resolve.commit.date The date string of when the commit was created
 * @param {Object[]} resolve.additions An array of JSON-LD objects representing statements added in the commit
 * @param {Object[]} resolve.deletions An array of JSON-LD objects representing statements deleted in the commit
 * @param {Function} dismiss A function that dismisses the modal
 */
const commitInfoOverlayComponent = {
    template,
    bindings: {
        resolve: '<',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: commitInfoOverlayComponentCtrl
};

commitInfoOverlayComponentCtrl.$inject = ['utilService', 'userManagerService', 'catalogManagerService']

function commitInfoOverlayComponentCtrl(utilService, userManagerService, catalogManagerService) {
    var dvm = this;
    dvm.util = utilService;
    dvm.um = userManagerService;
    dvm.cm = catalogManagerService;
    dvm.additions = {};
    dvm.deletions = {};
    dvm.hasMoreResults = false;

    dvm.$onInit = function() {
        dvm.additions = dvm.resolve.additions;
        dvm.deletions = dvm.resolve.deletions;
        dvm.hasMoreResults = dvm.resolve.hasMoreResults;
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
    dvm.retrieveMoreResults = function(limit, offset) {
        dvm.cm.getDifference(dvm.resolve.commit.id, null, limit, offset)
            .then(response => {
                dvm.additions = response.data.additions;
                dvm.deletions = response.data.deletions;
                var headers = response.headers();
                dvm.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
            }, errorMessage => {
                if (errorMessage) {
                    dvm.util.createErrorToast(errorMessage);
                }
            });
    }
}

export default commitInfoOverlayComponent;