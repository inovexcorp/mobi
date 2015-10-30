(function() {
    'use strict';

    angular
        .module('app')
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['$scope', '$http', '$timeout'];

    function OntologyEditorController($scope, $http, $timeout) {
        var _currentEdits = {},
            vm = this;

        /*
        - all the information needed to determine the state
        state = {
            ontologyIndex: int,
            classIndex: int || empty,
            propertyIndex: int || empty
        }

        - the four different states
        states = {
            everything, class, object, datatype
        }
        */

        vm.state = {};
        vm.current = {};
        vm.edit = edit;
        vm.tab = 'everything';
        vm.changeTab = changeTab;



        vm.isEdit;
        vm.createText = 'Create';
        vm.editText = 'Update';
        vm.shown = 'default';
        vm.selected = {};
        vm.ontologies = [];
        vm.versions = [];
        vm.header = '';
        vm.success = false;

        /* ----- Ontology variables ----- */
        vm.ontologyDefault = { '@id': '', '@type': 'owl:Ontology', delimiter: '#', classes: [] };
        vm.ontology = {};
        vm.createOntology = createOntology;
        vm.editOntology = editOntology;
        vm.submitOntology = submitOntology;

        /* ----- Class variables ----- */
        vm.classDefault = { '@id': '', '@type': 'owl:Class', properties: [] };
        vm.class = {};
        vm.createClass = createClass;
        vm.editClass = editClass;
        vm.submitClass = submitClass;

        /* ----- Property variables ----- */
        vm.propertyDefault = { '@id': '' };
        vm.property = {};
        vm.createProperty = createProperty;
        vm.editProperty = editProperty;
        vm.submitProperty = submitProperty;

        activate();

        function activate() {
            _getOntologies();
        }

        function _updateRefs(obj, old, fresh, isPrefix) {
            var prop, i, arr;

            // iterates over all of the properties of the object
            for(prop in obj) {
                if(Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                    i = obj[prop].length;
                    while(i--) {
                        _updateRefs(obj[prop][i], old, fresh, isPrefix);
                    }
                } else if(typeof obj[prop] === 'object') {
                    _updateRefs(obj[prop], old, fresh, isPrefix);
                } else if(obj[prop].indexOf(old) !== -1) {
                    obj[prop] = isPrefix ? obj[prop].replace(old, fresh) : fresh;
                }
            }
        }

        function _parseOntologies(flattened) {
            // testing speed
            var startTime = new Date().getTime();

            var obj, type, domain, j, classObj, property, ontology,
                classes = [],
                properties = [],
                list = angular.copy(flattened['@graph']),
                i = list.length;

            // seperating the types out
            while(i--) {
                obj = list[i];
                type = obj['@type'];

                switch(type) {
                    case 'owl:Ontology':
                        ontology = obj;
                        break;
                    case 'owl:Class':
                        obj.properties = [];
                        classes.push(obj);
                        break;
                    case 'owl:DataTypeProperty':
                    case 'owl:ObjectProperty':
                        properties.push(obj);
                        break;
                }
            }

            // iterates over all properties to find domain
            i = properties.length;
            while(i--) {
                property = properties[i];
                domain = property['rdfs:domain']['@id'];
                // iterates over all the classes to find matching @id
                j = classes.length;
                while(j--) {
                    classObj = classes[j];
                    if(classObj['@id'] === domain) {
                        classObj.properties.push(property);
                        break;
                    }
                }
            }

            // adds the classes to the ontology object
            ontology.classes = angular.copy(classes);

            // makes it an array because it will be later
            vm.ontologies.push(ontology);
            vm.versions.push([angular.copy(ontology)]);

            // updates the view with the changes made here
            $scope.$apply();
        }

        function _getOntologies() {
            var context = {
                    'owl': 'http://www.w3.org/2002/07/owl#',
                    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#'
                };

            // TODO: make a call to get the list of ontologies from some service
            $http.get('/example.json')
                .then(function(obj) {
                    // flatten the ontologies
                    jsonld.flatten(obj.data, context, function(err, flattened) {
                        _parseOntologies(flattened);
                    });
                });
        }

        function _showSuccess() {
            _saveState();
            vm.success = true;
            $timeout(function() {
                vm.success = false;
            }, 2000);
        }

        /* ----- State Functions ----- */
        function _saveState(ontologyIndex, classIndex, propertyIndex) {
            vm.state[vm.tab] = {
                ontologyIndex: ontologyIndex,
                classIndex: classIndex,
                propertyIndex: propertyIndex
            }
        }

        function _setState() {
            vm.current = vm.state[vm.tab];
            if(vm.current.propertyIndex != undefined) {
                vm.shown = 'property-editor';
            } else if(vm.current.classIndex != undefined) {
                vm.shown = 'class-editor';
            } else {
                vm.shown = 'ontology-editor';
            }
        }
        /* ----- End State Functions ----- */

        function changeTab(tab) {
            vm.tab = tab;
            if(vm.state[tab]) {
                _setState();
            } else {
                vm.shown = 'default';
            }
        }

        function edit(ontologyIndex, classIndex, propertyIndex) {
            _saveState(ontologyIndex, classIndex, propertyIndex);
            _setState();
        }

        function submitOntology(isValid) {
        }

        function createClass(ontology) {
        }

        function editClass(ontology, classObj) {
        }

        function submitClass(isValid) {
        }

        function createProperty(ontology, classObj) {
        }

        function editProperty(ontology, classObj, property) {
        }

        function submitProperty(isValid) {
        }
    }
})();