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
                    if (context[i][prop] === old) {
                        context[i][prop] = fresh;
                        break;
                    }
                    i++;
                }
            }

            self.editPrefix = function(edit, old, index, ontology) {
                var input = document.getElementById('prefix-' + index);
                if (edit) {
                    updateRefsService.update(ontology, old + ':', input.value + ':', ontology.mobi.owl);
                    updateContext(ontology.mobi.context, 'key', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.editValue = function(edit, key, old, index, ontology) {
                var input = document.getElementById('value-' + index);
                if (edit) {
                    updateRefsService.update(ontology, key + ':', old, ontology.mobi.owl);
                    updateRefsService.update(ontology, input.value, key + ':', ontology.mobi.owl);
                    updateContext(ontology.mobi.context, 'value', old, input.value);
                } else {
                    input.focus();
                }
            }

            self.add = function(key, value, ontology) {
                var deferred = $q.defer(),
                    context = ontology.mobi.context,
                    duplicate = _.findIndex(context, { 'key': key }) !== -1 || _.findIndex(context, { 'value': value }) !== -1;

                if (!duplicate) {
                    context.push({key: key, value: value});
                    updateRefsService.update(ontology, value, key + ':', ontology.mobi.owl);
                    deferred.resolve();
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            }

            self.remove = function(key, ontology) {
                var i = 0;

                while(i < ontology.mobi.context.length) {
                    if (ontology.mobi.context[i].key === key) {
                        updateRefsService.update(ontology, key + ':', ontology.mobi.context[i].value, ontology.mobi.owl);
                        ontology.mobi.context.splice(i, 1);
                        break;
                    }
                    i++;
                }
            }
        }
})();