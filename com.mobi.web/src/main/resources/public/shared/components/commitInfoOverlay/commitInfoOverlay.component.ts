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

import {get, map, merge, union, unionBy} from 'lodash';

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
 * @oaram {string} [recordId=''] recordId An optional IRI string representing an OntologyRecord to query for names if present
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

commitInfoOverlayComponentCtrl.$inject = ['$q', 'utilService', 'userManagerService', 'catalogManagerService', 'ontologyManagerService']

function commitInfoOverlayComponentCtrl($q, utilService, userManagerService, catalogManagerService, ontologyManagerService) {
    var dvm = this;
    var om = ontologyManagerService;
    dvm.util = utilService;
    dvm.um = userManagerService;
    dvm.cm = catalogManagerService;
    dvm.additions = {};
    dvm.deletions = {};
    dvm.hasMoreResults = false;
    dvm.entityNames = {};

    dvm.$onInit = function() {
        dvm.retrieveMoreResults(100, 0);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
    dvm.retrieveMoreResults = function(limit, offset) {
        dvm.cm.getDifference(dvm.resolve.commit.id, null, limit, offset)
            .then(response => {
                dvm.additions = unionBy(dvm.additions, response.data.additions, '@id');
                dvm.deletions = unionBy(dvm.deletions, response.data.deletions, '@id');
                var headers = response.headers();
                dvm.hasMoreResults = get(headers, 'has-more-results', false) === 'true';

                if (dvm.resolve.recordId) {
                    var diffIris = union(map(dvm.additions, '@id'), map(dvm.deletions, '@id'));
                    var filterIris = union(diffIris, dvm.util.getObjIrisFromDifference(dvm.additions), dvm.util.getObjIrisFromDifference(dvm.deletions));
                    if (filterIris.length > 0) {
                        return om.getOntologyEntityNames(dvm.resolve.recordId, '', dvm.resolve.commit.id, false, false, filterIris);
                    }
                }
                return $q.when();
            }, $q.reject)
            .then(data => {
                if (data) {
                    merge(dvm.entityNames, data);
                }
            }, errorMessage => {
                if (errorMessage) {
                    dvm.util.createErrorToast(errorMessage);
                }
            });
    }
    dvm.getEntityName = function(iri) {
        if (get(dvm, ['entityNames', iri, 'label'])) {
            return dvm.entityNames[iri].label;
        } else {
            return dvm.util.getBeautifulIRI(iri);
        }
    }
}

export default commitInfoOverlayComponent;