(function() {
    'use strict';

    angular
        .module('updateRefs', ['responseObj'])
        .service('updateRefsService', updateRefsService);

    updateRefsService.$inject = ['$filter', 'responseObj'];

    function updateRefsService($filter, responseObj) {
        var self = this;
        var exclude = [
                '$$hashKey',
                'context',
                'unsaved'
            ];

        self.update = function(obj, old, fresh) {
            var freshSplit = $filter('splitIRI')(fresh);
            // iterates over all of the properties of the object
            _.forOwn(obj, function(value, key) {
                var excluded = _.indexOf(exclude, key);

                // replaces the key if it is the old value
                if(key === old && excluded === -1) {
                    delete obj[key];
                    obj[fresh] = value;
                }

                // do nothing for these situations
                if(excluded !== -1 || !obj[key]) {
                    // do nothing
                }
                // checks all items in the array
                else if(Object.prototype.toString.call(value) === '[object Array]') {
                    _.forEach(value, function(item, index) {
                        // checks to see if it contains the old value
                        if(item === old) {
                            obj[key][index] = fresh;
                        }
                        // not a string, so update it
                        else if(responseObj.validateItem(item) && responseObj.getItemIri(item) === old) {
                            obj[key][index].localName = freshSplit.end;
                            obj[key][index].namespace = freshSplit.begin + freshSplit.then;
                        }
                        // not a string, so update it
                        else if(typeof item !== 'string') {
                            self.update(obj[key][index], old, fresh);
                        }
                    });
                }
                // objects need to be updated
                else if(typeof value === 'object') {
                    self.update(obj[key], old, fresh);
                }
                // change string value if it matches
                else if(value === old) {
                    obj[key] = fresh;
                }
            });
        }
    }
})();