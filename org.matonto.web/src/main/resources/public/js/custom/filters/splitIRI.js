(function() {
    'use strict';

    angular
        .module('splitIRI', [])
        .filter('splitIRI', splitIRI);

    function splitIRI() {
        return function(iri) {
            if(iri) {
                var index,
                    hash = iri.indexOf('#'),
                    slash = iri.lastIndexOf('/'),
                    colon = iri.lastIndexOf(':');

                if(hash !== -1) {
                    index = hash;
                } else if(slash !== -1) {
                    index = slash;
                } else {
                    index = colon;
                }

                return {
                    begin: iri.substring(0, index),
                    then: iri[index],
                    end: iri.substring(index + 1)
                }
            } else {
                return;
            }
        }
    }
})();