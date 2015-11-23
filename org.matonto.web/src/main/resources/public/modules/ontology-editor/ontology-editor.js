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
        var owl, rdfs,
            defaultRdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            defaultRdfs = 'http://www.w3.org/2000/01/rdf-schema#',
            defaultXsd = 'http://www.w3.org/2001/XMLSchema#',
            defaultOwl = 'http://www.w3.org/2002/07/owl#',
            vm = this;

        // public default variables
        vm.success = false;
        vm.shown = 'default';
        vm.tab = 'everything';
        vm.newPrefix = '';
        vm.newValue = '';
        vm.propertyDefault = { '@id': '', annotations: [] };
        vm.classDefault = { '@id': '', '@type': 'owl:Class', properties: [], annotations: [] };
        vm.ontologyDefault = _setOntologyDefault();
        vm.versions = [];
        vm.ontologies = [];
        vm.annotations = [];
        vm.state = {};
        vm.current = {};
        vm.newItems = {};
        vm.selected = {};

        // public functions
        vm.edit = edit;
        vm.reset = reset;
        vm.submit = submit;
        vm.addPrefix = addPrefix;
        vm.removePrefix = removePrefix;
        vm.changeTab = changeTab;
        vm.addAnnotation = addAnnotation;
        vm.removeAnnotation = removeAnnotation;
        vm.newDelimiter = newDelimiter;
        vm.editPrefix = editPrefix;
        vm.unsaved = unsaved;

        activate();

        function activate() {
            _getOntologies();
        }

        // creates the default ontology object used when creating a new ontology
        function _setOntologyDefault() {
            return {
                '@id': '',
                '@type': 'owl:Ontology',
                delimiter: '#',
                classes: [],
                context: [],
                annotations: [],
                context: {
                    rdf: defaultRdf,
                    rdfs: defaultRdfs,
                    xsd: defaultXsd,
                    owl: defaultOwl
                }
            };
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

        // if the uri of the ontology changes, this function will update the rest of the ids to match
        function _updateRefs(obj, old, fresh) {
            var prop, i, arr,
                exclude = [
                    '$$hashKey',
                    'annotationList',
                    'annotations',
                    'context',
                    'identifier',
                    'unsaved'
                ];

            // iterates over all of the properties of the object
            for(prop in obj) {
                // if anything in exclude list
                if(exclude.indexOf(prop) !== -1) {
                    // do nothing
                }
                // iterates through the array and recursively calls this function
                else if(Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                    i = obj[prop].length;
                    while(i--) {
                        _updateRefs(obj[prop][i], old, fresh);
                    }
                }
                // recursively call this function
                else if(typeof obj[prop] === 'object') {
                    _updateRefs(obj[prop], old, fresh);
                }
                // sets the prefix value for this object
                else if(prop === '@id' && obj['@type'] === vm.ontologies[vm.current.oi].owl + 'Ontology') {
                    obj.prefix = fresh;
                }
                // remove the old prefix and replace it with the new
                else if(obj[prop].indexOf(old) !== -1 && prop !== fresh.replace(':', '')) {
                    obj[prop] = fresh + obj[prop].replace(old, '');
                }
            }
        }

        // update the prefix because the delimiter was selected
        function newDelimiter(old) {
            var fresh = vm.selected.identifier + vm.selected.delimiter;
            _updateRefs(vm.selected, old, fresh);

            // sets selected as unsaved
            unsaved();
        }

        // determines which image should be shown depending on the type of property
        function _chooseIcon(property) {
            var icon = '',
                range = property[rdfs + 'range'];
            if(range) {
                switch(range['@id']) {
                    case 'xsd:string':
                        icon = 'fa-font';
                        break;
                    // TODO: pick better icon for this
                    case rdfs + 'Literal':
                        icon = 'fa-i-cursor';
                        break;
                    default:
                        icon = 'fa-code-fork fa-rotate-90';
                        break;
                }
            } else {
                // TODO: figure out what to do if there isn't a range
                icon = 'fa-question';
            }
            return icon;
        }

        // TODO: check the annotaions
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
        function _addAnnotationsTo(obj, rdfs, annotationList) {
            var prop,
                exclude = [
                    rdfs + 'label',
                    rdfs + 'comment',
                    rdfs + 'isDefinedBy',
                    rdfs + 'subClassOf',
                    rdfs + 'disjointWith',
                    rdfs + 'domain',
                    rdfs + 'range',
                    rdfs + 'subPropertyOf',
                    rdfs + 'inverseOf',
                    rdfs + 'equivalentClass',
                    '@id',
                    '@type',
                    'annotations',
                    'properties',
                    'classes',
                    'icon'
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

        // takes the flattened JSON-LD data and creates our custom tree structure
        function _parseOntologies(flattened, context, owl, rdfs) {
            var obj, type, domain, j, k, classObj, property, ontology, len, addToClass, delimiter,
                classes = [],
                properties = [],
                annotationList = [],
                noDomains = [],
                findOwner = [],
                list = flattened['@graph'] ? angular.copy(flattened['@graph']) : angular.copy(flattened),
                i = list.length;

            // seperating the types out
            while(i--) {
                obj = list[i];
                type = obj['@type'];

                switch(type) {
                    case owl + 'Ontology':
                        ontology = obj;
                        break;
                    case owl + 'Class':
                        obj.properties = [];
                        classes.push(obj);
                        break;
                    case owl + 'DatatypeProperty':
                    case owl + 'ObjectProperty':
                        obj.icon = _chooseIcon(obj);
                        properties.push(obj);
                        break;
                    case owl + 'AnnotationProperty':
                        annotationList.push(obj);
                        break;
                }
                // add all other properties to the annotation list
                _addAnnotationsTo(obj, rdfs, annotationList);
            }

            // adds the property to the class
            var addToClass = function(id, property) {
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
            i = properties.length;
            while(i--) {
                property = properties[i];
                domain = property[rdfs + 'domain'];

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
            ontology.context = objToArr(context);
            ontology.owl = owl;
            ontology.rdfs = rdfs;
            ontology.annotationList = _setAnnotations(rdfs, owl, annotationList);

            // checks to see if the initial context contains the ontology id already
            i = ontology.context.length;
            while(i--) {
                if(ontology.context[i].value === ontology['@id']) {
                    ontology.prefix = ontology.context[i].key + ':';
                    break;
                }
            }

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

        // checks the context for owl or rdfs prefixes
        function _checkContext(context) {
            // property variable needed
            var prop,
                result = {
                    owl: defaultOwl,
                    rdfs: defaultRdfs
                };
            // checks through all of the prefixes and replaces the owl/rdfs prefix used in the code here
            for(prop in context) {
                // setup owl prefix
                if(context.hasOwnProperty(prop) && context[prop] == defaultOwl) {
                    result.owl = prop + ':';
                }
                // setup rdfs prefix
                else if(context.hasOwnProperty(prop) && context[prop] == defaultRdfs) {
                    result.rdfs = prop + ':';
                }
            }
            return result;
        }

        // gets the ontologies and flattens them
        function _getOntologies() {
            // variable for the json-ld function
            var ontology,
                context = {};

            // NOTE: if you click away from this page and then come back, this ontology will not be there because of the JSONP callback issue which will not be an issue once API is bundled up
            $http.jsonp('http://localhost:8284/rest/ontology/getOntology?namespace=http%3A%2F%2Fwww.foaf.com&localName=localname&rdfFormat=default&callback=JSON_CALLBACK')
                .success(function(data) {
                    // TODO: remove this check later
                    if(data.ontology) {
                        var temp = {};
                        // parse the ontology
                        ontology = JSON.parse(data.ontology);
                        // sets the context if the ontology has it
                        if(ontology['@context']) {
                            context = ontology['@context'];
                        }
                        temp = _checkContext(context);
                        jsonld.flatten(ontology, context, function(err, flattened) {
                            _parseOntologies(flattened, context, temp.owl, temp.rdfs);
                        });
                    }
                });

            $http.get('/example.json')
                .then(function(obj) {
                    var temp = {};
                    // flatten the ontologies
                    jsonld.flatten(obj.data, obj.data['@context'], function(err, flattened) {
                        temp = _checkContext(obj.data['@context']);
                        _parseOntologies(flattened, obj.data['@context'], temp.owl, temp.rdfs);
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
            // gets the result based on the delimiter present
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
                // adds the updated prefix to the created element if present
                if(vm.ontologies[vm.current.oi].hasOwnProperty('prefix')) {
                    vm.newItems[unique].prefix = vm.ontologies[vm.current.oi].prefix;
                }
                // else, just uses the ontology's id if nothing is set
                else if(!vm.newItems[unique].hasOwnProperty('prefix')) {
                    vm.newItems[unique].prefix = vm.ontologies[vm.current.oi].identifier + vm.ontologies[vm.current.oi].delimiter;
                }
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
                // if has a domain associated with it (it is in the class.properties array)
                if(ci != undefined) {
                    _editOrCreate(vm.ontologies[oi].classes[ci].properties, pi, unique, vm.propertyDefault);
                }
                // else, it is in the noDomains array
                else {
                    _editOrCreate(vm.ontologies[oi].noDomains, pi, unique, vm.propertyDefault);
                }
                // cleans form validations
                vm.propertyForm.$setPristine();
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                vm.shown = 'class-editor';
                unique = vm.tab + oi + ci;
                // checks if editing or creating
                _editOrCreate(vm.ontologies[oi].classes, ci, unique, vm.classDefault);
                // cleans form validations
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
                if(pi !== undefined) {
                    // there is an ontology defined for the property being edited/created
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    // if pi != -1, an existing property is being edited
                    if(pi !== -1) {
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
                else if(ci !== undefined) {
                    // there is an ontology defined for the class being edited/created
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    // if ci != -1, an existing class is being edited
                    if(ci !== -1) {
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
                else if(oi !== -1) {
                    latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                    delete changed.classes;
                    changed['@id'] = changed.identifier + changed.delimiter;
                    latest = angular.merge(latest, changed);
                }
                // otherwise, an ontology is being created
                // do nothing since we have already copied vm.selected

                // if an ontology is not being created, add this version to the versions list
                // note: this will only be false whenever they are creating a new ontology
                if(oi !== -1) {
                    vm.versions[oi].push({ time: new Date(), ontology: latest });
                }
                // otherwise, add a new entry to versions with this new ontology
                else {
                    vm.ontologies.push(changed);
                    vm.versions.push([{ time: new Date(), ontology: changed }]);
                    delete vm.newItems[vm.tab + oi];
                    vm.current = { oi: vm.ontologies.length - 1, ci: undefined, pi: undefined };
                }

                // updates context if ontology was changed for the case where the id has a prefix set
                if(pi === undefined && ci === undefined && oi !== undefined) {
                    var old = vm.versions[oi][vm.versions[oi].length - 2].ontology['@id'],
                        fresh = changed['@id'];
                    _updateRefs(vm.ontologies[oi].context, old, fresh);
                    _updateRefs(vm.ontologies[oi], old, fresh);
                }

                // updates the selected item to be saved now
                vm.selected.unsaved = false;
            }
        }

        // converts the context object into an array
        function objToArr(context) {
            var prop,
                temp = [];
            for(prop in context) {
                if(context.hasOwnProperty(prop)) {
                    temp.push({key: prop, value: context[prop]});
                }
            }
            return temp;
        }

        // converts the context array into an object
        function arrToObj(context) {
            var temp = {},
                i = context.length;
            while(i--) {
                temp[context[i].key] = context[i].value;
            }
            return temp;
        }

        // adds a prefix to the context object
        function addPrefix() {
            var /*prop,*/
                duplicate = false,
                empty = !vm.newPrefix.length || !vm.newValue.length,
                i = vm.selected.context;
            // checks to make sure that it is unique - OBJECT VERSION
            /*for(prop in vm.selected.context) {
                if(vm.selected.context.hasOwnProperty(prop) && (prop == vm.newPrefix || vm.selected[prop] == vm.newValue)) {
                    duplicate = true;
                    break;
                }
            }*/
            // checks to make sure that it is unique - ARRAY VERSION
            while(i--) {
                if(vm.selected.context[i].key == vm.newPrefix || vm.selected.context[i].value == vm.newValue) {
                    duplicate = true;
                    break;
                }
            }
            // if not a duplicate and not empty, add it and reset the fields
            if(!duplicate && !empty) {
                // vm.selected.context[vm.newPrefix] = vm.newValue; - OBJECT VERSION
                vm.selected.context.push({key: vm.newPrefix, value: vm.newValue}); // - ARRAY VERSION
                // replaces the value anywhere in the object if present
                _updateRefs(vm.ontologies[vm.current.oi], vm.newValue, vm.newPrefix + ':');
                // resets the input values
                vm.newPrefix = '';
                vm.newValue = '';
                // clears messages that were shown
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
        function removePrefix(key) {
            // _updateRefs(vm.ontologies[vm.current.oi], key + ':', vm.ontologies[vm.current.oi].context[key]); - OBJECT VERSION
            // delete vm.selected.context[key]; - OBJECT VERSION
            var i = vm.ontologies[vm.current.oi].context.length;
            while(i--) {
                if(vm.ontologies[vm.current.oi].context[i].key === key) {
                    _updateRefs(vm.ontologies[vm.current.oi], key + ':', vm.ontologies[vm.current.oi].context[i].value);
                    vm.ontologies[vm.current.oi].context.splice(i, 1);
                    break;
                }
            }
        }

        // saves the edits made to the prefix for the ontology
        function editPrefix(edit, old, index, value) {
            var input = document.getElementById('prefix-' + index);
            if(edit) {
                // updates the values in the ontology object
                _updateRefs(vm.ontologies[vm.current.oi], old + ':', input.value + ':');
                // adds the new property
                // vm.ontologies[vm.current.oi].context[input.value] = value; - OBJECT VERSION
                // removes the old property
                // delete vm.ontologies[vm.current.oi].context[old]; - OBJECT VERSION
                var i = vm.ontologies[vm.current.oi].context.length;
                while(i--) {
                    if(vm.ontologies[vm.current.oi].context[i].key == old) {
                        vm.ontologies[vm.current.oi].context[i].key = input.value;
                        break;
                    }
                }
            } else {
                // focuses the newly editable input
                input.focus();
            }
        }

        // marks the selected item as unsaved
        function unsaved() {
            vm.selected.unsaved = true;
        }
    }
})();
