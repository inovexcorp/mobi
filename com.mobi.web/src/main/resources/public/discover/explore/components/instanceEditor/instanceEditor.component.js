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
     * @name instanceEditor.component:instanceEditor
     * @requires $q
     * @requires shared.service:discoverStateService
     * @requires shared.service:utilService
     * @requires discover.service:exploreService
     * @requires explore.service:exploreUtilsService
     *
     * @description
     * HTML contents in the instance view page which shows the complete list of properties
     * associated with the selected instance in an editable format.
     */
    const instanceEditorComponent = {
        templateUrl: 'discover/explore/components/instanceEditor/instanceEditor.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: instanceEditorComponentCtrl
    };

    instanceEditorComponent.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'exploreUtilsService'];

    function instanceEditorComponentCtrl($q, discoverStateService, utilService, exploreService, exploreUtilsService) {
        var dvm = this;
        var es = exploreService;
        var eu = exploreUtilsService;
        dvm.ds = discoverStateService;
        dvm.util = utilService;
        dvm.isValid = true;

        dvm.save = function() {
            dvm.ds.explore.instance.entity = eu.removeEmptyPropertiesFromArray(dvm.ds.explore.instance.entity);
            var instance = dvm.ds.getInstance();
            es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                .then(() => es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit, limit: dvm.ds.explore.instanceDetails.limit}), $q.reject)
                .then(response => {
                    dvm.ds.explore.instanceDetails.data = response.data;
                    dvm.ds.explore.instance.metadata = _.find(response.data, {instanceIRI: instance['@id']});
                    dvm.ds.explore.breadcrumbs[dvm.ds.explore.breadcrumbs.length - 1] = dvm.ds.explore.instance.metadata.title;
                    dvm.ds.explore.editing = false;
                }, dvm.util.createErrorToast);
        }
        dvm.cancel = function() {
            dvm.ds.explore.instance.entity = dvm.ds.explore.instance.original;
            dvm.ds.explore.editing = false;
        }
    }

    angular.module('explore')
        .component('instanceEditor', instanceEditorComponent);
})();