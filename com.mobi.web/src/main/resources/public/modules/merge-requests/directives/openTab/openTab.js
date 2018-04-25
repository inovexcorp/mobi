/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name openTab
         *
         * @description
         * The `openTab` module only provides the `openTab` directive which creates a Bootstrap `row`
         * with a {@link block.directive:block} with the list of open MergeRequests.
         */
        .module('openTab', [])
        /**
         * @ngdoc directive
         * @name openTab.directive:openTab
         * @scope
         * @restrict E
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires userManager.service:userManagerService
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `openTab` is a directive which creates a Bootstrap `row` with a single column containing a
         * {@link block.directive:block} with the list of open MergeRequests retrieved by the
         * {@link mergeRequestsManager.service:mergeRequestsManagerService}. The directive is replaced
         * by the contents of its template.
         */
        .directive('openTab', openTab);

        openTab.$inject = ['mergeRequestManagerService', 'utilService', 'prefixes', 'userManagerService', 'catalogManagerService', '$q'];

        function openTab(mergeRequestManagerService, utilService, prefixes, userManagerService, catalogManagerService, $q) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/openTab/openTab.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var mm = mergeRequestManagerService;
                    var um = userManagerService;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id');
                    var util = utilService;
                    dvm.requests = [];

                    var recordTitles = {};

                    mm.getRequests()
                        .then(data => {
                            dvm.requests = _.map(data, request => ({
                                request,
                                title: util.getDctermsValue(request, 'title'),
                                date: getDate(request),
                                creator: getCreator(request),
                                recordIri: util.getPropertyId(request, prefixes.mergereq + 'onRecord')
                            }));
                            var recordsToRetrieve = _.uniq(_.chain(dvm.requests)
                                .map('recordIri')
                                .filter(iri => !_.has(recordTitles, iri))
                                .value());
                            return $q.all(_.map(recordsToRetrieve, iri => cm.getRecord(iri, catalogId)));
                        }, $q.reject)
                        .then(responses => {
                            _.forEach(responses, record => {
                                var title = util.getDctermsValue(record, 'title');
                                recordTitles[record['@id']] = title;
                                _.forEach(_.filter(dvm.requests, {recordIri: record['@id']}), request => request.recordTitle = title);
                            });
                        }, error => {
                            dvm.requests = [];
                            util.createErrorToast(error);
                        });

                    function getDate(request) {
                        var dateStr = util.getDctermsValue(request, 'issued');
                        return util.getDate(dateStr, 'shortDate');
                    }
                    function getCreator(request) {
                        var iri = util.getDctermsId(request, 'creator');
                        return _.get(_.find(um.users, {iri}), 'username');
                    }
                }
            }
        }
})();