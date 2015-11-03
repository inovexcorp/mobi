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
        vm.newPrefix = '';
        vm.newValue = '';
        vm.propertyDefault = { '@id': '' };
        vm.classDefault = { '@id': '', '@type': 'owl:Class', properties: [] };
        vm.ontologyDefault = { '@id': '', '@type': 'owl:Ontology', delimiter: '#', classes: [] };
        vm.edit = edit;
        vm.reset = reset;
        vm.submit = submit;
        vm.addPrefix = addPrefix;
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
            // TODO: figure out how to handle the @graph and @context because @context is a 1-1 to the prefix story for this sprint.
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
            // array format to work better with dual binding and updates
            vm.context = [
                { key: 'owl', value: 'http://www.w3.org/2002/07/owl#' },
                { key: 'rdf', value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
                { key: 'rdfs', value: 'http://www.w3.org/2000/01/rdf-schema#' }
            ];

            // variable for the json-ld function
            var context = contextArrToObj();

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
            var isDirty;
            vm.state[vm.tab] = {
                oi: oi,
                ci: ci,
                pi: pi
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
                // if they don't have the prefix already found, find and set it
                if(!item.hasOwnProperty('prefix')) {
                    item.prefix = _stripPrefix(item['@id']);
                    item['@id'] = item['@id'].replace(item.prefix, '');
                }
                vm.selected = item;
            }
        }

        // sets the current state of the page
        function _setState() {
            var arr, item, unique, oi, ci, pi;
            vm.current = vm.state[vm.tab];
            oi = vm.current.oi;
            ci = vm.current.ci;
            pi = vm.current.pi;

            // if property index is specified, they are working with a property
            if(pi != undefined) {
                vm.shown = 'property-editor';
                unique = vm.tab + oi + ci + pi;
                _editOrCreate(vm.ontologies[oi].classes[ci].properties, pi, unique);
                vm.propertyForm.$setPristine();
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                vm.shown = 'class-editor';
                unique = vm.tab + oi + ci;
                _editOrCreate(vm.ontologies[oi].classes, ci, unique);
                vm.classForm.$setPristine();
            }
            // else, they have to be working with an ontology
            else {
                vm.shown = 'ontology-editor';
                vm.selected = (oi === -1) ? vm.ontologyDefault : vm.ontologies[oi];
                vm.ontologyForm.$setPristine();
            }
        }

        // changes the form on the right depending on what tab they have selected
        function changeTab(tab) {
            vm.tab = tab;
            if(vm.state[tab]) {
                _setState();
            } else {
                vm.shown = 'default';
                vm.current = {};
            }
        }

        // sets the state to edit the selected object and saves the previous state that they just left
        function edit(oi, ci, pi) {
            _saveState(oi, ci, pi);
            _setState();
        }

        // reverts the old and new objects and updates the id
        function _revert(item, copy, exception, updateId) {
            // updates the copy object to undo any additions that have been added
            var prop;
            for(prop in item) {
                if(item.hasOwnProperty(prop) && !copy.hasOwnProperty(prop) && prop !== exception && prop !== 'prefix') {
                    copy[prop] = undefined;
                } else if(prop === exception) {
                    delete copy[prop];
                }
            }
            // merge the two to revert back to the original
            item = angular.merge(item, copy);
            // strips out the prefix from the id of the restored item (if updateId is true)
            if(updateId) item['@id'] = item['@id'].replace(item.prefix, '');
        }

        // resets the state to the latest saved version
        function reset() {
            var copy,
                oi = vm.current.oi,
                ci = vm.current.ci,
                pi = vm.current.pi,
                lastSaved = vm.versions[oi][vm.versions[oi].length - 1].ontology,
                current = vm.ontologies[oi];
            // if property index is specified, they are working with a property
            if(pi != undefined) {
                _revert(current.classes[ci].properties[pi], lastSaved.classes[ci].properties[pi], '', true);
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                _revert(current.classes[ci], angular.copy(lastSaved.classes[ci]), 'properties', true);
            }
            // else, they have to be working with an ontology
            else {
                _revert(current, angular.copy(lastSaved), 'classes', false);
            }
        }

        // submits the form
        function submit(isValid) {
            if(isValid) {
                var changed,
                    oi = vm.current.oi,
                    ci = vm.current.ci,
                    pi = vm.current.pi,
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                if(pi != undefined) {
                    latest.classes[ci].properties[pi] = angular.merge(latest.classes[ci].properties[pi], angular.copy(vm.ontologies[oi].classes[ci].properties[pi]));
                } else if(ci != undefined) {
                    changed = angular.copy(vm.ontologies[oi].classes[ci]);
                    delete changed.properties;
                    latest.classes[ci] = angular.merge(latest.classes[ci], changed);
                } else {
                    changed = angular.copy(vm.ontologies[oi]);
                    delete changed.classes;
                    latest = angular.merge(latest, changed);
                }
                vm.versions[oi].push({time: new Date(), ontology: latest});
            }
        }

        // adds a prefix to the context object
        function addPrefix() {
            var duplicate = false,
                empty = !vm.newPrefix.length || !vm.newValue.length,
                i = vm.context.length;
            // checks to make sure that it is unique
            while(i--) {
                if(vm.context[i].key == vm.newPrefix || vm.context[i].value == vm.newValue) {
                    duplicate = true;
                    break;
                }
            }
            // if not a duplicate and not empty, add it and reset the fields
            if(!duplicate && !empty) {
                vm.context.push({ key: vm.newPrefix, value: vm.newValue });
                vm.newPrefix = '';
                vm.newValue = '';
                vm.showDuplicateMessage = false;
                vm.showEmptyMessage = false;
            }
            // else, let them know that it is a duplicate of something
            else if(duplicate) {
                vm.showDuplicateMessage = true;
                vm.showEmptyMessage = false;
            }
            // else, let them know that they need to fill them in
            else {
                vm.showDuplicateMessage = false;
                vm.showEmptyMessage = true;
            }
        }

        // create context object from context array
        function contextArrToObj() {
            var item,
                temp = {},
                i = vm.context.length;
            while(i--) {
                item = vm.context[i];
                temp[item.key] = item.value;
            }
            return temp;
        }
    }
})();
