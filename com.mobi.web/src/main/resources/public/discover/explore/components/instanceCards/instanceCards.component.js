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
     * @name explore.component:instanceCards
     * @requires $q
     * @requires shared.service:discoverStateService
     * @requires discover.service:exploreService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `instanceCards` is a component that creates a div which contains a 3 column grid used to display the
     * instance details for a class associated with a dataset record.
     *
     * @param {Object[]} instanceData the details about the instances to be present as cards
     */
    const instanceCardsComponent = {
        templateUrl: 'discover/explore/components/instanceCards/instanceCards.component.html',
        bindings: {
            instanceData: '<'
        },
        controllerAs: 'dvm',
        controller: instanceCardsComponentCtrl
    };

    instanceCardsComponent.$inject = ['$q', 'discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'modalService']

    function instanceCardsComponentCtrl($q, discoverStateService, exploreService, exploreUtilsService, utilService, modalService) {
        var dvm = this;
        var ds = discoverStateService;
        var es = exploreService;
        var util = utilService;
        var eu = exploreUtilsService;
        dvm.classTitle = _.last(ds.explore.breadcrumbs);
        dvm.showDeleteOverlay = false;
        dvm.chunks = [];

        dvm.$onInit = function() {
            dvm.chunks = getChunks(dvm.instanceData);
        }
        dvm.$onChanges = function() {
            dvm.chunks = getChunks(dvm.instanceData);
        }
        dvm.view = function(item) {
            es.getInstance(ds.explore.recordId, item.instanceIRI)
                .then(response => {
                    ds.explore.instance.entity = response;
                    ds.explore.instance.metadata = item;
                    ds.explore.breadcrumbs.push(item.title);
                    return eu.getReferencedTitles(item.instanceIRI, ds.explore.recordId);
                }, $q.reject)
                .then(response => {
                    ds.explore.instance.objectMap = {};
                    if (_.has(response, 'results')) {
                        _.forEach(response.results.bindings, binding => ds.explore.instance.objectMap[binding.object.value] = binding.title.value);
                    }
                }, util.createErrorToast);
        }
        dvm.delete = function(item) {
            es.deleteInstance(ds.explore.recordId, item.instanceIRI)
                .then(() => {
                    util.createSuccessToast('Instance was successfully deleted.');
                    ds.explore.instanceDetails.total--;
                    if (ds.explore.instanceDetails.total === 0) {
                        return es.getClassDetails(ds.explore.recordId);
                    }
                    if (ds.explore.instanceDetails.data.length === 1) {
                        ds.explore.instanceDetails.currentPage--;
                    }
                    var offset = (ds.explore.instanceDetails.currentPage - 1) * ds.explore.instanceDetails.limit;
                    return es.getClassInstanceDetails(ds.explore.recordId, ds.explore.classId, {offset, limit: ds.explore.instanceDetails.limit});
                }, $q.reject)
                .then(response => {
                    if (ds.explore.instanceDetails.total === 0) {
                        ds.explore.classDetails = response;
                        ds.clickCrumb(0);
                    } else {
                        var resultsObject = es.createPagedResultsObject(response);
                        ds.explore.instanceDetails.data = resultsObject.data;
                        ds.explore.instanceDetails.links = resultsObject.links;
                    }
                }, util.createErrorToast);
        }
        dvm.confirmDelete = function(item) {
            modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + item.title + '</strong>?</p>', () => dvm.delete(item));
        }

        function getChunks(data) {
            return _.chunk(_.orderBy(data, ['title']), 3);
        }
    }

    angular.module('explore')
        .component('instanceCards', instanceCardsComponent);
})();