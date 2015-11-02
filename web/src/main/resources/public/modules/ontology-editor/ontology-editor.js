/*
 * Throughout this file you will see these abbreviations used repeatedly. Instead of commenting this everytime, I put them up here once.
 * oi - ontology index
 * ci - class index
 * pi - property index
 */

(function() {
    'use strict';

    angular
        .module('app')
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['$scope', '$http', '$timeout'];

    function OntologyEditorController($scope, $http, $timeout) {
        var _currentEdits = {},
            vm = this;

        vm.success = false;
        vm.shown = 'default';
        vm.tab = 'everything';
        vm.propertyDefault = { '@id': '' };
        vm.classDefault = { '@id': '', '@type': 'owl:Class', properties: [] };
        vm.ontologyDefault = { '@id': '', '@type': 'owl:Ontology', delimiter: '#', classes: [] };
        vm.edit = edit;
        vm.changeTab = changeTab;
        vm.versions = [];
        vm.ontologies = [];
        vm.state = {};
        vm.current = {};
        vm.selected = {};
        vm.newItems = {};

        activate();

        function activate() {
            _getOntologies();
        }

        // if the uri of the ontology changes, this function will update the rest of the ids to match
        function _updateRefs(obj, old, fresh) {
            var prop, i, arr;

            // iterates over all of the properties of the object
            for(prop in obj) {
                if(Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                    i = obj[prop].length;
                    while(i--) {
                        _updateRefs(obj[prop][i], old, fresh);
                    }
                } else if(typeof obj[prop] === 'object') {
                    _updateRefs(obj[prop], old, fresh);
                } else if(obj[prop].indexOf(old) !== -1) {
                    obj[prop] = fresh + _stripPrefix(obj[prop]);
                }
            }
        }

        // takes the flattened JSON-LD data and creates our custom tree structure
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
            vm.versions.push([{time: new Date(), ontology: angular.copy(ontology)}]);

            // updates the view with the changes made here
            $scope.$apply();
        }

        // gets the ontologies and flattens them
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

        // shows the success function above the form on the right side
        function _showSuccess() {
            _saveState();
            vm.success = true;
            $timeout(function() {
                vm.success = false;
            }, 2000);
        }

        // saves the current state for when they change the tabs on the right
        function _saveState(oi, ci, pi) {
            vm.state[vm.tab] = {
                ontologyIndex: oi,
                classIndex: ci,
                propertyIndex: pi
            }
        }

        // removes the beginning of the @id which is referenced here by the 'id'
        function _stripPrefix(id) {
            var result = '',
                hash = id.indexOf('#'),
                slash = id.lastIndexOf('/'),
                colon = id.lastIndexOf(':');
            if(hash !== -1) {
                result = id.substring(0, hash + 1);
            } else if(slash !== -1) {
                result = id.substring(0, slash + 1);
            } else if(colon !== -1) {
                result = id.substring(0, colon + 1);
            }
            return result;
        }

        // finds out whether they are editing or creating an object
        function _editOrCreate(arr, index, unique) {
            // if they are creating
            if(index === -1) {
                // checks to see if they were already editing this node
                if(!vm.newItems.hasOwnProperty(unique)) vm.newItems[unique] = angular.copy(vm.propertyDefault);
                vm.selected = vm.newItems[unique];
            }
            // else, they are editing
            else {
                var item = arr[index];
                item.prefix = _stripPrefix(item['@id']);
                item['@id'] = item['@id'].replace(item.prefix, '');
                vm.selected = arr[index];
            }
        }

        // sets the current state of the page
        function _setState(oi, ci, pi) {
            var arr, item, unique;
            vm.current = vm.state[vm.tab];
            // if property index is specified, they are working with a property
            if(pi != undefined) {
                vm.shown = 'property-editor';
                unique = vm.tab + vm.current.ontologyIndex + vm.current.classIndex + vm.current.propertyIndex;
                _editOrCreate(vm.ontologies[oi].classes[ci].properties, pi, unique);
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                vm.shown = 'class-editor';
                unique = vm.tab + vm.current.ontologyIndex + vm.current.classIndex;
                _editOrCreate(vm.ontologies[oi].classes, ci, unique);
            }
            // else, they have to be working with an ontology
            else {
                vm.shown = 'ontology-editor';
                vm.selected = (oi === -1) ? vm.ontologyDefault : vm.ontologies[oi];
            }
        }

        // changes the form on the right depending on what tab they have selected
        function changeTab(tab) {
            vm.tab = tab;
            if(vm.state[tab]) {
                _setState();
            } else {
                vm.shown = 'default';
            }
        }

        // sets the state to edit the selected object and saves the previous state that they just left
        function edit(oi, ci, pi) {
            _saveState(oi, ci, pi);
            _setState(oi, ci, pi);
        }
    }
})();
