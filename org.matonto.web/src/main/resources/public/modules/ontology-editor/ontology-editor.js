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
        vm.ontologyDefault = { '@id': '', '@type': 'owl:Ontology', delimiter: '#', classes: [], context: [] };
        vm.edit = edit;
        vm.reset = reset;
        vm.submit = submit;
        vm.addPrefix = addPrefix;
        vm.removePrefix = removePrefix;
        vm.changeTab = changeTab;
        vm.addAnnotation = addAnnotation;
        vm.removeAnnotation = removeAnnotation;
        vm.versions = [];
        vm.ontologies = [];
        vm.annotations = [];
        vm.state = {};
        vm.current = {};
        vm.newItems = {};
        vm.selected = {};

        activate();

        function activate() {
            _getOntologies();
            _setAnnotations();
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
            // adds the item to the actual object
            vm.selected[vm.selected.currentAnnotation] = vm.selected.currentAnnotationValue;
            // adds the annotation to the list of items used to determine which is shown in the drop down
            if(vm.selected.annotations) {
                vm.selected.annotations.push(vm.selected.currentAnnotation);
            } else {
                vm.selected.annotations = [vm.selected.currentAnnotation];
            }
            // resets the value
            vm.selected.currentAnnotation = 'default';
            vm.selected.currentAnnotationValue = '';
        }

        // TODO: check the annotaions
        // sets the built-in annotations provided by OWL 2 - http://www.w3.org/TR/owl2-syntax/#Annotation_Properties
        function _setAnnotations() {
            vm.annotations = [
                'rdfs:seeAlso',
                'rdfs:isDefinedBy',
                'owl:deprecated',
                'owl:versionInfo',
                'owl:priorVersion',
                'owl:backwardCompatibleWith',
                'owl:incompatibleWith'
            ];
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

        // determines which image should be shown depending on the type of property
        function _chooseIcon(property) {
            var icon = '',
                range = property['rdfs:range'];
            // TODO: figure out what to do if there isn't a range
            if(range) {
                switch(range['@id']) {
                    case 'xsd:string':
                        icon = 'fa-font';
                        break;
                    // TODO: pick a better icon for this
                    case 'rdfs:Literal':
                        icon = 'fa-bolt';
                        break;
                    default:
                        icon = 'fa-code-fork fa-rotate-90';
                        break;
                }
            } else {
                // console.log(property['@id'] + ' does not have a range');
            }
            return icon;
        }

        // takes the flattened JSON-LD data and creates our custom tree structure
        function _parseOntologies(flattened, context) {
            // TODO: figure out how to handle the @graph and @context because @context is a 1-1 to the prefix story for this sprint.
            var obj, type, domain, j, k, classObj, property, ontology, len, addToClass, delimiter,
                classes = [],
                properties = [],
                noDomains = [],
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
                    case 'owl:DatatypeProperty':
                    case 'owl:ObjectProperty':
                        obj.icon = _chooseIcon(obj);
                        properties.push(obj);
                        break;
                }
            }

            // adds the property to the class
            addToClass = function(id, property) {
                j = classes.length;
                while(j--) {
                    classObj = classes[j];
                    if(classObj['@id'] === id) {
                        property.prefix = _stripPrefix(property['@id']);
                        property['@id'] = property['@id'].replace(property.prefix, '');
                        classObj.properties.push(property);
                        break;
                    }
                }
            }

            // iterates over all properties to find domain
            // TODO: check if you actually need this part
            i = properties.length;
            while(i--) {
                property = properties[i];
                domain = property['rdfs:domain'];

                // TODO: figure out what to do if it doesn't have a domain specified
                if(domain) {
                    if(Object.prototype.toString.call(domain) === '[object Array]') {
                        k = domain.length;
                        while(k--) {
                            addToClass(domain[k]['@id'], property);
                        }
                    } else {
                        addToClass(domain['@id'], property);
                    }
                } else {
                    property.prefix = _stripPrefix(property['@id']);
                    property['@id'] = property['@id'].replace(property.prefix, '');
                    noDomains.push(property);
                }
            }

            // updates the classes prefix property
            i = classes.length;
            while(i--) {
                classes[i].prefix = _stripPrefix(classes[i]['@id']);
                classes[i]['@id'] = classes[i]['@id'].replace(classes[i].prefix, '');
            }

            // adds the classes, context and properties without domains to the ontology
            ontology.classes = classes;
            ontology.noDomains = noDomains;
            ontology.context = angular.copy(vm.context);

            // checks to see if the ontology has a delimiter specified already
            len = ontology['@id'].length;
            delimiter = ontology['@id'].charAt(len - 1);

            // if it does, remove it from the identifier part
            if(delimiter == '#' || delimiter == ':' || delimiter == '/') {
                ontology.delimiter = delimiter;
                ontology.identifier = ontology['@id'].substring(0, len - 1);
            } else {
                ontology.delimiter = '#';
                ontology.identifier = ontology['@id'];
            }

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
                {key: 'owl', value: 'http://www.w3.org/2002/07/owl#'},
                {key: 'rdf', value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
                {key: 'rdfs', value: 'http://www.w3.org/2000/01/rdf-schema#'},
                {key: 'xsd', value: 'http://www.w3.org/2001/XMLSchema#'}
            ];

            // variable for the json-ld function
            var ontology,
                context = contextArrToObj();

            // NOTE: if you click away from this page and then come back, this ontology will not be there because of the JSONP callback issue which will not be an issue once API is bundled up
            $http.jsonp('http://localhost:8284/rest/ontology/getOntology?namespace=http%3A%2F%2Fwww.foaf.com&localName=localname&rdfFormat=default&callback=JSON_CALLBACK')
                .success(function(data) {
                    if(data.ontology) {
                        ontology = JSON.parse(data.ontology);
                        jsonld.flatten(ontology, context, function(err, flattened) {
                            _parseOntologies(flattened, vm.context);
                        });
                    }
                });

            $http.get('/example.json')
                .then(function(obj) {
                    // flatten the ontologies
                    jsonld.flatten(obj.data, context, function(err, flattened) {
                        _parseOntologies(flattened, vm.context);
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
        function _editOrCreate(arr, index, unique, base) {
            // if they are creating
            if(index === -1) {
                // checks to see if they were already editing this node
                if(!vm.newItems.hasOwnProperty(unique)) vm.newItems[unique] = angular.copy(base);
                vm.selected = vm.newItems[unique];
                // selects the default annotation
                vm.selected.currentAnnotation = 'default';
            }
            // else, they are editing
            else {
                vm.selected = arr[index];
                // checks to see if the current annotation has been selected yet.
                if(!vm.selected.currentAnnotation) vm.selected.currentAnnotation = 'default';
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
                if(ci != undefined) {
                    _editOrCreate(vm.ontologies[oi].classes[ci].properties, pi, unique, vm.propertyDefault);
                } else {
                    _editOrCreate(vm.ontologies[oi].noDomains, pi, unique, vm.propertyDefault);
                }
                vm.propertyForm.$setPristine();
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                vm.shown = 'class-editor';
                unique = vm.tab + oi + ci;
                _editOrCreate(vm.ontologies[oi].classes, ci, unique, vm.classDefault);
                vm.classForm.$setPristine();
            }
            // else, they have to be working with an ontology
            else {
                vm.shown = 'ontology-editor';
                unique = vm.tab + oi;
                _editOrCreate(vm.ontologies, oi, unique, vm.ontologyDefault);
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
            // if all angular validation passes
            if(isValid) {
                var latest,
                    oi = vm.current.oi,
                    ci = vm.current.ci,
                    pi = vm.current.pi,
                    changed = angular.copy(vm.selected);

                // a property is being submitted
                if(pi != undefined) {
                    // there is an ontology defined for the property being edited/created
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    // if pi != -1, an existing property is being edited
                    if(pi != -1) {
                        latest.classes[ci].properties[pi] = angular.merge(latest.classes[ci].properties[pi], changed);
                    }
                    // otherwise, a property is being created
                    else {
                        vm.ontologies[oi].classes[ci].properties.push(changed);
                        latest.classes[ci].properties.push(changed);
                        delete vm.newItems[vm.tab + oi + ci + pi];
                        vm.current = { oi: oi, ci: ci, pi: vm.ontologies[oi].classes[ci].properties.length - 1 };
                    }
                }

                // a class is being submitted
                else if(ci != undefined) {
                    // there is an ontology defined for the class being edited/created
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    // if ci != -1, an existing class is being edited
                    if(ci != -1) {
                        latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                        delete changed.properties;
                        latest.classes[ci] = angular.merge(latest.classes[ci], changed);
                    }
                    // otherwise, a class is being created
                    else {
                        vm.ontologies[oi].classes.push(changed);
                        latest.classes.push(changed);
                        delete vm.newItems[vm.tab + oi + ci];
                        vm.current = { oi: oi, ci: vm.ontologies[oi].classes.length - 1, pi: undefined };
                    }
                }

                // an ontology is being submitted
                // if oi != -1, an existing ontology is being edited
                else if(oi != -1) {
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    delete changed.classes;
                    changed['@id'] = changed.identifier + changed.delimiter;
                    latest = angular.merge(latest, changed);
                }
                // otherwise, an ontology is being created
                // do nothing since we have already copied vm.selected

                // if an ontology is not being created, add this version to the versions list
                // note: this will only be false whenever they are creating a new ontology
                if(oi != -1) {
                    vm.versions[oi].push({ time: new Date(), ontology: latest });
                }
                // otherwise, add a new entry to versions with this new ontology
                else {
                    vm.ontologies.push(changed);
                    vm.versions.push([{ time: new Date(), ontology: changed }]);
                    delete vm.newItems[vm.tab + oi];
                    vm.current = { oi: vm.ontologies.length - 1, ci: undefined, pi: undefined };
                }
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
                vm.selected.context.push({ key: vm.newPrefix, value: vm.newValue });
                vm.newPrefix = '';
                vm.newValue = '';
                vm.showDuplicateMessage = false;
                vm.showEmptyMessage = false;
            }
            // else, let them know that it is a duplicate of something
            else if(duplicate) {
                vm.showDuplicateMessage = true;
            }
            // else, let them know that they need to fill them in
            else {
                vm.showEmptyMessage = true;
            }
        }

        // removes the prefix from the ontology
        function removePrefix(index) {
            vm.selected.context.splice(index, 1);
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
