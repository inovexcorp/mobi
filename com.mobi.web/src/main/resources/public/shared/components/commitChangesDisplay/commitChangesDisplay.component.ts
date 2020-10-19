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

import { map, forEach } from 'lodash';

import './commitChangesDisplay.component.scss';

const template = require('./commitChangesDisplay.component.html');

/**
 * @ngdoc component
 * @name shared.component:commitChangesDisplay
 * @requires shared.service:utilService
 *
 * @description
 * `commitChangesDisplay` is a component that creates a sequence of divs displaying the changes made to entities
 * separated by additions and deletions. Each changes display uses the `.property-values` class. The display of an
 * entity's name can be optionally controlled by the provided `entityNameFunc` function and defaults to the
 * {@link shared.service:utilService beautified local name} of the IRI.
 *
 * @param {Object[]} additions An array of JSON-LD objects representing statements added
 * @param {Object[]} deletions An array of JSON-LD objects representing statements deleted
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by it's IRI. The component will pass the IRI of the entity as the only argument
 * @param {Function} showMoreResultsFunc A function retrieve more difference results. Will pass the limit and offset as arguments.
 * @param {boolean} hasMoreResults A boolean indicating if the commit has more results to display
 * @param {int} startIndex An integer representing how many differences to display
 */
const commitChangesDisplayComponent = {
    template,
    bindings: {
        additions: '<',
        deletions: '<',
        entityNameFunc: '<?',
        showMoreResultsFunc: '&',
        hasMoreResults: '<',
        startIndex: '<?'
    },
    controllerAs: 'dvm',
    controller: commitChangesDisplayComponentCtrl
};

commitChangesDisplayComponentCtrl.$inject = ['utilService'];

function commitChangesDisplayComponentCtrl(utilService) {
    var dvm = this;
    dvm.size = 100; // Must be the same as the limit prop in the commitHistoryTable
    dvm.index = 0;
    dvm.util = utilService;
    dvm.list = [];
    dvm.chunkList = [];
    dvm.results = {};
    dvm.showMore = false;

    dvm.$onInit = function() {
        if (dvm.startIndex) {
            dvm.index = dvm.startIndex;
        }
    }
    dvm.$onChanges = function() {
        var adds = map(dvm.additions, '@id');
        var deletes = map(dvm.deletions, '@id');
        dvm.list = adds.concat(deletes.filter(i => adds.indexOf(i) == -1));
        dvm.addPagedChangesToResults();
    }
    dvm.addPagedChangesToResults = function() {
        forEach(dvm.list, id => {
            addToResults(dvm.util.getChangesById(id, dvm.additions), dvm.util.getChangesById(id, dvm.deletions), id, dvm.results);
        });
        dvm.showMore = dvm.hasMoreResults;
    }
    dvm.getMorePagedChanges = function() {
        dvm.index += dvm.size;
        dvm.showMoreResultsFunc({limit: dvm.size, offset: dvm.index}); // Should trigger $onChanges
    }
    function addToResults(additions, deletions, id, results) {
        results[id] = { additions: additions, deletions: deletions };
    }
}

export default commitChangesDisplayComponent;