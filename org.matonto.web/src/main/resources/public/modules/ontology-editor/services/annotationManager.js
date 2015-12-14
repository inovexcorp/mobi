(function() {
    'use strict';

    angular
        .module('annotationManager', [])
        .service('annotationManagerService', annotationManagerService);

        annotationManagerService.$inject = ['$http'];

        function annotationManagerService($http) {
            var self = this,
                prefix = '/matonto/rest/ontology';

            // sets the built-in annotations provided by OWL 2 - http://www.w3.org/TR/owl2-syntax/#Annotation_Properties
            function _setAnnotations(rdfs, owl, arr) {
                // default owl2 annotations
                var item,
                    i = arr.length,
                    temp = [
                        rdfs + 'seeAlso',
                        rdfs + 'isDefinedBy',
                        owl + 'deprecated',
                        owl + 'versionInfo',
                        owl + 'priorVersion',
                        owl + 'backwardCompatibleWith',
                        owl + 'incompatibleWith'
                    ];

                // adds the ontology specific annotations
                while(i--) {
                    temp.push(arr[i]['@id']);
                }

                // returns the combined array
                return temp;
            }

            // add annotations to the list necessary
            function _addAnnotationsTo(obj, rdfs, owl, annotationList) {
                var prop,
                    exclude = [
                        owl + 'disjointWith',
                        rdfs + 'comment',
                        rdfs + 'domain',
                        rdfs + 'equivalentClass',
                        rdfs + 'inverseOf',
                        rdfs + 'isDefinedBy',
                        rdfs + 'label',
                        rdfs + 'range',
                        rdfs + 'subClassOf',
                        rdfs + 'subPropertyOf',
                        '@id',
                        '@type',
                        'annotations',
                        'classes',
                        'icon',
                        'properties'
                    ];

                // adds the annotations property to the object
                obj.annotations = [];

                // looks for all annotations not used elsewhere
                for(prop in obj) {
                    // adds all the other non-rdfs:label
                    if(obj.hasOwnProperty(prop) && exclude.indexOf(prop) === -1) {
                        obj.annotations.push(prop);
                    }
                }
            }

            // removes the annotation
            function removeAnnotation(item) {
                var i = vm.selected.annotations.length;
                // remove it from the annotations list
                while(i--) {
                    if(item == vm.selected.annotations[i]) {
                        vm.selected.annotations.splice(i, 1);
                    }
                }
                // removes it from the object itself
                delete vm.selected[item];
            }

            // adds the annotation that the user is editing
            function addAnnotation() {
                var add;

                // adds the item to the actual object
                if(vm.selected.currentAnnotation !== 'other') {
                    vm.selected[vm.selected.currentAnnotation] = vm.selected.currentAnnotationValue;
                    add = vm.selected.currentAnnotation;
                } else {
                    vm.selected[vm.selected.currentAnnotationKey] = vm.selected.currentAnnotationValue;
                    add = vm.selected.currentAnnotationKey;
                }

                // adds the annotation to the list of items used to determine which is shown in the drop down
                vm.selected.annotations.push(add);

                // resets the value
                vm.selected.currentAnnotation = 'default';
                vm.selected.currentAnnotationValue = '';
                vm.selected.currentAnnotationKey = '';

                // resets unsaved
                vm.selected.unsaved = false;
            }
        }
})();