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
     * @name commitCompiledResource.component:commitCompiledResource
     * @requires $q
     * @requires http.service:httpService
     * @requires catalogManager.service:catalogManagerService
     * @requires ontologyState.service:ontologyStateService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `commitCompiledResource` is a component that returns a compiled resource containing the commit chain of the
     * provided commit. This compiled resource can be used to show the additions and deletions in addition to the
     * previous commit's data of a particular entity at the provided commit.
     *
     * @param {string} commitId The IRI string of a commit in the local catalog
     * @param {string} [entityId=''] entityId filters the resource with entityId as the
     *          subject.
     */
    const commitCompiledResourceComponent = {
        templateUrl: 'components/commitCompiledResource/commitCompiledResource.html',
        bindings: {
            commitId: '<',
            entityId: '<?'
        },
        controllerAs: 'dvm',
        controller: commitCompiledResourceComponentCtrl
    };

    commitCompiledResourceComponentCtrl.$inject = ['$q', 'httpService', 'catalogManagerService', 'ontologyStateService', 'ontologyUtilsManagerService'];

    function commitCompiledResourceComponentCtrl($q, httpService, catalogManagerService, ontologyStateService, ontologyUtilsManagerService) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.os = ontologyStateService;

        dvm.error = '';
        dvm.resource = undefined;
        dvm.id = 'commit-compiled-resource';

        dvm.$onChanges = function(changes) {
            if (_.has(changes, 'commitId') || _.has(changes, 'entityId')) {
                dvm.setResource();
            }
        }
        dvm.setResource = function() {
            if (dvm.commitId) {
                httpService.cancel(dvm.id);
                cm.getCompiledResource(dvm.commitId, dvm.entityId, dvm.id)
                    .then(resources => {
                        dvm.resource = _.omit(resources[0], ['@id', '@type']);
                        return cm.getCommit(dvm.commitId);
                    }, $q.reject)
                    .then(response => {
                        var additions = _.omit(_.find(response.additions, {'@id': dvm.entityId}), ['@id', '@type']);
                        var deletions = _.omit(_.find(response.deletions, {'@id': dvm.entityId}), ['@id', '@type']);
                        _.forEach(additions, (values, prop) => {
                            _.forEach(values, value => {
                                var resourceVal = _.find(dvm.resource[prop], value);
                                if (resourceVal) {
                                    resourceVal.add = true;
                                }
                            });
                        });
                        _.forEach(deletions, (values, prop) => {
                            _.forEach(values, value => { value.del = true });
                        });
                        _.mergeWith(dvm.resource, deletions, (objValue, srcValue) => {
                            if (_.isArray(objValue)) {
                                return objValue.concat(srcValue);
                            }
                        });
                        dvm.error = '';
                    }, errorMessage => {
                        dvm.error = errorMessage;
                        dvm.resource = undefined;
                    });
            } else {
                dvm.resource = undefined;
            }
        }
    }
    angular.module('commitCompiledResource', [])
            .component('commitCompiledResource', commitCompiledResourceComponent);
})();
