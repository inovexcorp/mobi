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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name public.component:commitCompiledResource
     * @scope
     * @restrict E
     * @requires catalogManager.service:catalogManagerService
     * @requires util.service:utilService
     * @requires userManager.service:userManagerService
     * @requires modal.service:modalService
     *
     * @description
     * `commitCompiledResource` is a component that creates a table containing the commit chain of the provided commit.
     * Can optionally also display a SVG graph generated using Snap.svg showing the network of the commits along
     * with an optional title for the top commit. Clicking on a commit id or its corresponding circle in the graph
     * will open up a {@link commitInfoOverlay.directive:commitInfoOverlay commit info overlay}. Can optionally
     * provide a variable to bind the retrieved commits to. The directive is replaced by the content of the template.
     *
     * @param {string} commitId The IRI string of a commit in the local catalog
     * @param {string} [entityId=''] entityId filters the resource with entityId as the
     *          subject.
     * @param {Object[]} commitData A variable to bind the retrieved commits to
     */
    const commitCompiledResourceComponent = {
        templateUrl: 'components/commitCompiledResource/commitCompiledResource.html',
        bindings: {
            commitId: '<',
            entityId: '<?',
            resourceData: '=?'
        },
        controllerAs: 'dvm',
        controller: commitCompiledResourceCtrl
    };

    commitCompiledResourceCtrl.$inject = ['httpService', 'catalogManagerService', 'utilService', 'userManagerService', 'modalService', 'Snap', 'chroma'];

    function commitCompiledResourceCtrl(httpService, catalogManagerService, utilService, userManagerService, modalService, Snap, chroma) {
        var dvm = this;
        var cm = catalogManagerService;
        var util = utilService;
        var um = userManagerService;
        dvm.error = '';
        dvm.additions = [];
        dvm.deletions = [];
        dvm.id = 'commit-compiled-resource';

        dvm.$onChanges = function(changes) {
            if (_.has(changes, 'commitId') || _.has(changes, 'entityId')) {
                dvm.getResources();
            }
        }
        dvm.getResources = function() {
            if(dvm.commitId) {
                httpService.cancel(dvm.id);
                var promise = cm.getCompiledResource(dvm.commitId, dvm.entityId, dvm.id);
                promise.then(resources => {
                    dvm.resources = resources;
                    dvm.resourceData = resources;
                    dvm.error = '';
                }, errorMessage => {
                    dvm.error = errorMessage;
                    dvm.resources = [];
                    dvm.resourceData = [];
                });
            } else {
                dvm.resources = [];
                dvm.resourceData = [];
            }
        }
    }
    angular.module('commitCompiledResource', [])
            .component('commitCompiledResource', commitCompiledResourceComponent);
})();
