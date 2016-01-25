(function() {
    'use strict';

    angular
        .module('prefixManager', ['updateRefs'])
        .service('prefixManagerService', prefixManagerService);

        prefixManagerService.$inject = ['$q', 'updateRefsService'];

        function prefixManagerService($q, updateRefsService) {
            var self = this;

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
                    // updateRefsService.update(ontology, old + ':', input.value + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'key', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.editValue = function(edit, key, old, index, ontology) {
                var input = document.getElementById('value-' + index);
                if(edit) {
                    // updateRefsService.update(ontology, key + ':', old, ontology.matonto.owl);
                    // updateRefsService.update(ontology, input.value, key + ':', ontology.matonto.owl);
                    updateContext(ontology.matonto.context, 'value', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.add = function(key, value, ontology) {
                var deferred = $q.defer(),
                    context = ontology.matonto.context,
                    duplicate = false,
                    i = 0;

                while(i < context.length) {
                    if(context[i].key === key || context[i].value === value) {
                        duplicate = true;
                        break;
                    }
                    i++;
                }

                if(!duplicate) {
                    context.push({key: key, value: value});
                    // updateRefsService.update(ontology, value, key + ':', ontology.matonto.owl);
                    deferred.resolve();
                } else if(duplicate) {
                    deferred.reject();
                }

                return deferred.promise;
            }

            self.remove = function(key, ontology) {
                var i = 0;

                while(i < ontology.matonto.context.length) {
                    if(ontology.matonto.context[i].key === key) {
                        updateRefsService.update(ontology, key + ':', ontology.matonto.context[i].value, ontology.matonto.owl);
                        ontology.matonto.context.splice(i, 1);
                        break;
                    }
                    i++;
                }
            }
        }
})();