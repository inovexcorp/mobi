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