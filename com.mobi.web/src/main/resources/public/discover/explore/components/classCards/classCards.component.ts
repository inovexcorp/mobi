/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { merge, chunk, orderBy } from 'lodash';

import './classCards.component.scss';

const template = require('./classCards.component.html');
    
/**
 * @ngdoc component
 * @name explore.component:classCards
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires shared.service:utilService
 *
 * @description
 * `classCards` is a component that creates a div which contains a 3 column grid used to display the
 * class details associated with a dataset record.
 *
 * @param {Object[]} classDetails the details about the classes to be presented as cards
 */
const classCardsComponent = {
    template,
    bindings: {
        classDetails: '<'
    },
    controllerAs: 'dvm',
    controller: classCardsComponentCtrl
};

classCardsComponentCtrl.$inject = ['discoverStateService', 'exploreService', 'utilService'];

function classCardsComponentCtrl(discoverStateService, exploreService, utilService) {
    var dvm = this;
    var ds = discoverStateService;
    var es = exploreService;
    var util = utilService;

    dvm.$onInit = function() {
        dvm.chunks = getChunks(dvm.classDetails);
    }
    dvm.$onChanges = function() {
        dvm.chunks = getChunks(dvm.classDetails);
    }
    dvm.exploreData = function(item) {
        es.getClassInstanceDetails(ds.explore.recordId, item.classIRI, {offset: 0, limit: ds.explore.instanceDetails.limit})
            .then(response => {
                ds.explore.classId = item.classIRI;
                ds.explore.classDeprecated = item.deprecated;
                ds.resetPagedInstanceDetails();
                merge(ds.explore.instanceDetails, es.createPagedResultsObject(response));
                ds.explore.breadcrumbs.push(item.classTitle);
            }, util.createErrorToast);
    }

    function getChunks(data) {
        return chunk(orderBy(data, ['instancesCount', 'classTitle'], ['desc', 'asc']), 3);
    }
}

export default classCardsComponent;
