/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
        .module('httpService', [])
        .service('httpService', httpService);

    httpService.$inject = ['$q', '$http'];

    function httpService($q, $http) {
        var self = this;
        self.pending = [];

        self.isPending = function(id) {
            return _.some(self.pending, {id});
        }

        self.cancel = function(id) {
            if (self.isPending(id)) {
                _.find(self.pending, {id}).canceller.resolve();
            }
        }

        self.get = function(url, config, id, cancelMatch = false) {
            var canceller = $q.defer();
            self.pending.push({id, canceller});
            var requestPromise = $http.get(url, _.merge(config, {timeout: canceller.promise}));
            requestPromise.finally(() => {
                _.forEach(self.pending, request => {
                    if (request.id === id) {
                        _.pull(self.pending, request);
                        return false;
                    }
                });
            });
            return requestPromise;
        }
    }
})();
