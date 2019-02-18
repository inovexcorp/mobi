(function() {
    'use strict';

    angular
        .module('prefixation', [])
        .filter('prefixation', prefixation);

    prefixation.$inject = ['prefixes'];

    function prefixation(prefixes) {
        return function(iri, extraPrefixes={}) {
            var result = angular.copy(iri);
            if (typeof result === 'string') {
                _.forOwn(_.merge({}, prefixes, extraPrefixes), (namespace, prefix) => {
                    if (_.includes(result, namespace)) {
                        result = _.replace(result, namespace, prefix + ':');
                        return;
                    }
                });
            }
            return result;
        }
    }
})();
