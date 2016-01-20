(function() {
    'use strict';

    angular
        .module('prefixManager', [])
        .service('prefixManagerService', prefixManagerService);

        prefixManagerService.$inject = [];

        function prefixManagerService() {
            var self = this;

            function updateRefs(obj, old, fresh, owl) {
                var temp, prop, i, arr, excluded,
                    exclude = [
                        '$$hashKey',
                        'context',
                        'unsaved'
                    ];

                // iterates over all of the properties of the object
                for(prop in obj) {
                    excluded = exclude.indexOf(prop);
                    // checks to see if the property contains the old string
                    if(prop.indexOf(old) !== -1 && excluded === -1) {
                        // copies current value
                        temp = angular.copy(obj[prop]);
                        // deletes property
                        delete obj[prop];
                        // adds new property name
                        prop = prop.replace(old, fresh);
                        obj[prop] = temp;
                    }

                    // if anything in exclude list
                    if(excluded !== -1) {
                        // do nothing
                    }
                    // iterates through the array and recursively calls this function
                    else if(Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                        i = obj[prop].length;
                        while(i--) {
                            // means that it is the annotationList
                            if(typeof obj[prop][i] === 'string') {
                                obj[prop][i] = obj[prop][i].replace(old, fresh);
                            }
                            // else, something else
                            else {
                                updateRefs(obj[prop][i], old, fresh, owl);
                            }
                        }
                    }
                    // recursively call this function
                    else if(typeof obj[prop] === 'object') {
                        updateRefs(obj[prop], old, fresh, owl);
                    }
                    // sets the prefix value for this object
                    else if(prop === '@id' && obj['@type'] === owl + 'Ontology') {
                        obj.matonto.prefix = obj.matonto.prefix ? obj.matonto.prefix.replace(old, fresh) : fresh;
                    }
                    // saves the code from breaking by trying to find the indexOf some undefined property
                    // TODO: remove this console.warn for production as it is just used for testing
                    else if(!obj[prop]) {
                        console.warn('*' + prop + '* is undefined ->', obj);
                    }
                    // remove the old prefix and replace it with the new
                    else if(obj[prop].indexOf(old) !== -1) {
                        obj[prop] = obj[prop].replace(old, fresh);
                    }
                }
            }

            function updateContext(context, prop, old, fresh) {
                var i = 0;
                while(i < context.length) {
                    if(context[i][prop] === old) {
                        context[i][prop] = fresh;
                        break;
                    }
                    i++;
                }
            }

            self.editPrefix = function(edit, old, index, ontology) {
                var input = document.getElementById('prefix-' + index);
                if(edit) {
                    updateRefs(ontology, old + ':', input.value + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'key', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.editValue = function(edit, key, old, index, ontology) {
                var input = document.getElementById('value-' + index);
                if(edit) {
                    updateRefs(ontology, key + ':', old, ontology.matonto.owl);
                    updateRefs(ontology, input.value, key + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'value', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.add = function(key, value, ontology) {
                var context = ontology.matonto.context,
                    duplicate = false,
                    empty = !key.length || !value.length,
                    i = 0;

                while(i < context.length) {
                    if(context[i].key === key || context[i].value === value) {
                        duplicate = true;
                        break;
                    }
                    i++;
                }

                if(!duplicate && !empty) {
                    context.push({key: key, value: value});
                    updateRefs(ontology, value, key + ':', ontology.matonto.owl);
                } else if(duplicate) {
                    console.log('this is a duplicate');
                } else {
                    console.log('this is empty');
                }
            }

            self.remove = function(key, ontology) {
                var i = ontology.matonto.context.length;
                while(i--) {
                    if(ontology.matonto.context[i].key === key) {
                        updateRefs(ontology.matonto, key + ':', ontology.matonto.context[i].value, ontology.matonto.owl);
                        ontology.matonto.context.splice(i, 1);
                        break;
                    }
                }
            }
        }
})();