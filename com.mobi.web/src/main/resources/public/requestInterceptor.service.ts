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
import { includes, has } from 'lodash';

requestInterceptor.$inject = ['$q', '$rootScope'];

function requestInterceptor($q, $rootScope) {
    $rootScope.pendingRequests = 0;

    function checkConfig(config) {
        return !includes(config.url, '.html') && !has(config, 'timeout');
    }

    function handleStop(config) {
        if (checkConfig(config)) {
            $rootScope.pendingRequests--;
        }
    }

    return {
        'request': function (config) {
            if (checkConfig(config)) {
                $rootScope.pendingRequests++;
            }
            return config || $q.when(config);
        },
        'requestError': function(rejection) {
            handleStop(rejection.config);
            return $q.reject(rejection);
        },
        'response': function(response) {
            handleStop(response.config);
            return response || $q.when(response);
        },
        'responseError': function(rejection) {
            handleStop(rejection.config);
            return $q.reject(rejection);
        }
    };
}

export default requestInterceptor;