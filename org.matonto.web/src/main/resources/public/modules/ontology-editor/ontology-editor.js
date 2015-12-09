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
        vm.original = '';
        vm.propertyDefault = { '@id': '', annotations: [] };
        vm.classDefault = { '@id': '', '@type': 'owl:Class', properties: [], annotations: [] };
        vm.ontologyDefault = _setOntologyDefault();
        vm.annotations = [];
        vm.ontologies = [];
        vm.versions = [];
        vm.current = {};
        vm.newItems = {};
        vm.selected = {};
        vm.state = {};

        // public functions
        vm.addAnnotation = addAnnotation;
        vm.addPrefix = addPrefix;
        vm.changeTab = changeTab;
        vm.edit = edit;
        vm.editPrefix = editPrefix;
        vm.isTaken = isTaken;
        vm.removeAnnotation = removeAnnotation;
        vm.removePrefix = removePrefix;
        vm.reset = reset;
        vm.submit = submit;
        vm.unsaved = unsaved;
        vm.uploadClicked = uploadClicked;
        vm.uploadOntology = uploadOntology;

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
                taken: [],
                annotationList: _setAnnotations('rdfs:', 'owl:', []),
                rdfs: 'rdfs:',
                owl: 'owl:',
                context: objToArr({ rdf: defaultRdf, rdfs: defaultRdfs, xsd: defaultXsd, owl: defaultOwl })
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
            var temp, prop, i, arr, excluded,
                exclude = [
                    '$$hashKey',
                    'context',
                    'currentAnnotation',
                    'identifier',
                    'tab',
                    'taken',
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
                            _updateRefs(obj[prop][i], old, fresh);
                        }
                    }
                }
                // recursively call this function
                else if(typeof obj[prop] === 'object') {
                    _updateRefs(obj[prop], old, fresh);
                }
                // sets the prefix value for this object
                else if(prop === '@id' && obj['@type'] === vm.ontologies[vm.current.oi].owl + 'Ontology') {
                    obj.prefix = obj.prefix ? obj.prefix.replace(old, fresh) : fresh;
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

        // determines which image should be shown depending on the type of property
        function _chooseIcon(property, rdfs, xsd) {
            var icon = '',
                range = property[rdfs + 'range'];
            // assigns the icon based on the range
            if(range) {
                switch(range['@id']) {
                    // TODO: pick better icon for Literal? since it can be for Integers as well
                    case xsd + 'string':
                    case rdfs + 'Literal':
                        icon = 'fa-font';
                        break;
                    default:
                        icon = 'fa-link';
                        break;
                }
            }
            // TODO: figure out what to do if there isn't a range
            else {
                icon = 'fa-question';
            }
            // return the class for an icon from Font Awesome
            return icon;
        }

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

        // takes the flattened JSON-LD data and creates our custom tree structure
        function _parseOntologies(flattened, context, owl, rdfs, xsd) {
            var obj, type, domain, j, k, classObj, property, ontology, len, addToClass, delimiter,
                taken = [],
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
                        // adds the class name to the taken list
                        taken.push(_getPrefixAndSuffix(obj['@id']).suffix);
                        break;
                    case owl + 'DatatypeProperty':
                    case owl + 'ObjectProperty':
                        obj.icon = _chooseIcon(obj, rdfs, xsd);
                        properties.push(obj);
                        // adds the property name to the taken list
                        taken.push(_getPrefixAndSuffix(obj['@id']).suffix);
                        break;
                    case owl + 'AnnotationProperty':
                        annotationList.push(obj);
                        // adds the annotation name to the taken list
                        taken.push(_getPrefixAndSuffix(obj['@id']).suffix);
                        break;
                }
                // add all other properties to the annotation list
                _addAnnotationsTo(obj, rdfs, owl, annotationList);
            }

            // adds the property to the class
            var addToClass = function(id, property) {
                j = classes.length;
                while(j--) {
                    classObj = classes[j];
                    if(classObj['@id'] === id) {
                        property.prefix = _getPrefixAndSuffix(property['@id']).prefix;
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
                // since it has a domain, put it with the proper class
                if(domain) {
                    if(Object.prototype.toString.call(domain) === '[object Array]') {
                        k = domain.length;
                        while(k--) {
                            addToClass(domain[k]['@id'], property);
                        }
                    } else {
                        addToClass(domain['@id'], property);
                    }
                }
                // adds it to the noDomains array for now
                else {
                    property.prefix = _getPrefixAndSuffix(property['@id']).prefix;
                    property['@id'] = property['@id'].replace(property.prefix, '');
                    noDomains.push(property);
                }
            }

            // updates the classes prefix property
            i = classes.length;
            while(i--) {
                classes[i].prefix = _getPrefixAndSuffix(classes[i]['@id']).prefix;
                classes[i]['@id'] = classes[i]['@id'].replace(classes[i].prefix, '');
            }

            // adds the classes, context and properties without domains to the ontology
            ontology.classes = classes;
            ontology.noDomains = noDomains;
            ontology.context = objToArr(context);
            ontology.owl = owl;
            ontology.rdfs = rdfs;
            ontology.annotationList = _setAnnotations(rdfs, owl, annotationList);
            ontology.taken = taken;

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
                    rdfs: defaultRdfs,
                    xsd: defaultXsd
                };
            // checks through all of the prefixes and replaces the owl/rdfs prefix used in the code here
            for(prop in context) {
                // makes sure it has the property
                if(context.hasOwnProperty(prop)) {
                    switch(context[prop]) {
                        // sets the owl variable
                        case defaultOwl:
                            result.owl = prop + ':';
                            break;
                        // sets the rdfs variable
                        case defaultRdfs:
                            result.rdfs = prop + ':';
                            break;
                        // sets the xsd variable
                        case defaultXsd:
                            result.xsd = prop + ':';
                            break;
                    }
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
            /*$http.jsonp('/matonto/rest/ontology/getOntology?namespace=http%3A%2F%2Fwww.foaf.com&localName=localname&rdfFormat=default&callback=JSON_CALLBACK')
                .success(function(data) {
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
                            _parseOntologies(flattened, context, temp.owl, temp.rdfs, temp.xsd);
                        });
                    }
                });*/

            /*$http.get('/matonto/rest/ontology/getAllOntologyIds')
                .success(function(data) {
                    var key, localName, namespace,
                        i = data.length;
                    while(i--) {
                        data[i]
                    }
                });*/

            $http.get('/example.json')
                .then(function(obj) {
                    var temp = {};
                    // flatten the ontologies
                    jsonld.flatten(obj.data, obj.data['@context'], function(err, flattened) {
                        temp = _checkContext(obj.data['@context']);
                        _parseOntologies(flattened, obj.data['@context'], temp.owl, temp.rdfs, temp.xsd);
                    });
                });
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
        function _getPrefixAndSuffix(id) {
            var result = {},
                hash = id.indexOf('#') + 1,
                slash = id.lastIndexOf('/') + 1,
                colon = id.lastIndexOf(':') + 1;
            // gets the result based on the delimiter present
            if(hash !== 0) {
                result = { prefix: id.substring(0, hash), suffix: id.substring(hash) };
            } else if(slash !== 0) {
                result = { prefix: id.substring(0, slash), suffix: id.substring(slash) };
            } else if(colon !== 0) {
                result = { prefix: id.substring(0, colon), suffix: id.substring(colon) };
            }
            return result;
        }

        // finds out whether they are editing or creating an object
        function _editOrCreate(arr, index, unique, base) {
            // if they are creating
            if(index === -1) {
                // checks to see if they were already editing this node
                if(!vm.newItems.hasOwnProperty(unique)) {
                    vm.newItems[unique] = angular.copy(base);
                }
                // makes sure it is not creating
                if(vm.current.oi !== -1) {
                    // adds the updated prefix to the created element if present
                    if(vm.ontologies[vm.current.oi].hasOwnProperty('prefix')) {
                        vm.newItems[unique].prefix = vm.ontologies[vm.current.oi].prefix;
                    }
                    // else, just uses the ontology's id if nothing is set
                    else if(!vm.newItems[unique].hasOwnProperty('prefix')) {
                        vm.newItems[unique].prefix = vm.ontologies[vm.current.oi].identifier + vm.ontologies[vm.current.oi].delimiter;
                    }
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
            arr = vm.versions[oi];

            // if property index is specified, they are working with a property
            if(pi !== undefined) {
                vm.shown = 'property-editor';
                unique = vm.tab + oi + ci + pi;
                // if has a domain associated with it (it is in the class.properties array)
                if(ci !== undefined) {
                    _editOrCreate(vm.ontologies[oi].classes[ci].properties, pi, unique, vm.propertyDefault);
                    // finds what the current original value
                    vm.original = (pi !== -1) ? arr[arr.length - 1].ontology.classes[ci].properties[pi]['@id'] : '';
                }
                // else, it is in the noDomains array
                else {
                    _editOrCreate(vm.ontologies[oi].noDomains, pi, unique, vm.propertyDefault);
                }
                // cleans form validations
                vm.propertyForm.$setPristine();
            }
            // else, if class index is specified, they are working with a class
            else if(ci !== undefined) {
                vm.shown = 'class-editor';
                unique = vm.tab + oi + ci;
                // checks if editing or creating
                _editOrCreate(vm.ontologies[oi].classes, ci, unique, vm.classDefault);
                // finds what the current original value
                vm.original = (ci !== -1) ? arr[arr.length - 1].ontology.classes[ci]['@id'] : '';
                // cleans form validations
                vm.classForm.$setPristine();
            }
            // else, if ontology index is specified, they are working with an ontology
            else if(oi !== undefined) {
                vm.shown = 'ontology-editor';
                unique = vm.tab + oi;
                _editOrCreate(vm.ontologies, oi, unique, vm.ontologyDefault);
                // resets vm.original
                vm.original = '';
                vm.ontologyForm.$setPristine();
            }
            // else, they must be uploading an ontology
            else {
                vm.shown = 'upload-form';
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
        function _revert(item, copy, exceptions, updateId) {
            // updates the copy object to undo any additions that have been added
            var prop, excluded;
            for(prop in item) {
                // checks to see if it is one of the excluded properties
                excluded = exceptions.indexOf(prop) !== -1;
                // updates the object if needed
                if(item.hasOwnProperty(prop) && !copy.hasOwnProperty(prop) && !excluded && prop !== 'prefix') {
                    copy[prop] = undefined;
                } else if(excluded) {
                    delete copy[prop];
                }
            }
            // merge the two to revert back to the original
            item = angular.merge(item, copy);
            // strips out the prefix from the id of the restored item (if updateId is true which happens when you are working with classes or properties)
            if(updateId) {
                item['@id'] = item['@id'].replace(item.prefix, '');
            }
            // else, they are working with an ontology
            else if(item.hasOwnProperty('classes') && item.classes.length) {
                // update class and property prefixes
                _updateRefs(item, angular.copy(item.classes[0].prefix), item['@id']);
            }
        }

        // resets the state to the latest saved version
        function reset() {
            // gets the next version
            var copy, lastSaved,
                oi = vm.current.oi,
                ci = vm.current.ci,
                pi = vm.current.pi,
                temp = vm.versions[oi],
                current = vm.ontologies[oi];
            // removes latest version
            temp.pop();
            // gets the last version saved
            lastSaved = temp[temp.length - 1].ontology;

            // if property index is specified, they are working with a property
            if(pi != undefined) {
                _revert(current.classes[ci].properties[pi], angular.copy(lastSaved.classes[ci].properties[pi]), [], true);
            }
            // else, if class index is specified, they are working with a class
            else if(ci != undefined) {
                _revert(current.classes[ci], angular.copy(lastSaved.classes[ci]), ['properties'], true);
            }
            // else, they have to be working with an ontology
            else {
                _revert(current, angular.copy(lastSaved), ['classes', 'context'], false);
            }
        }

        // submits the form
        function submit(isValid) {
            // if all angular validation passes
            if(isValid) {
                var latest, temp,
                    oi = vm.current.oi,
                    ci = vm.current.ci,
                    pi = vm.current.pi,
                    changed = angular.copy(vm.selected);
                // sets the changed item to saved now
                changed.unsaved = false;
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
                        temp = vm.ontologies[oi].classes[ci].properties
                        vm.current = { oi: oi, ci: ci, pi: temp.length - 1 };
                        vm.selected = temp[temp.length - 1];
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
                    // TODO: make sure that it has a unique iri
                    else {
                        vm.ontologies[oi].classes.push(changed);
                        latest.classes.push(changed);
                        delete vm.newItems[vm.tab + oi + ci];
                        temp = vm.ontologies[oi].classes;
                        vm.current = { oi: oi, ci: temp.length - 1, pi: undefined };
                        vm.selected = temp[temp.length - 1];
                    }
                }
                // an ontology is being submitted
                else {
                    // update the changed @id to combine the two fields that create it
                    changed['@id'] = changed.identifier + changed.delimiter;
                    // if oi != -1, an existing ontology is being edited
                    if(oi !== -1) {
                        latest = angular.copy(vm.versions[oi][vm.versions[oi].length - 1].ontology);
                        delete changed.classes;
                        latest = angular.merge(latest, changed);
                        // updates the selected @id
                        vm.selected['@id'] = vm.selected.identifier + vm.selected.delimiter;
                    }
                }
                // updates the taken array with the class/property changes
                if(pi !== undefined || ci !== undefined) {
                    // gets the array and index of current name
                    var arr = vm.ontologies[oi].taken,
                        index = arr.indexOf(vm.original),
                        fresh = changed['@id'];
                    // makes sure that the item is in the array already
                    if(index !== -1) {
                        // sets the taken array
                        arr[index] = fresh;
                        // sets the original to the new value
                        vm.original = fresh;
                    }
                }
                // if an ontology is not being created, add this version to the versions list
                // note: this will only be false whenever they are creating a new ontology
                if(oi !== -1) {
                    vm.versions[oi].push({ time: new Date(), ontology: angular.copy(latest) });
                }
                // otherwise, add a new entry to versions with this new ontology
                else {
                    vm.ontologies.push(changed);
                    vm.versions.push([{ time: new Date(), ontology: angular.copy(changed) }]);
                    delete vm.newItems[vm.tab + oi];
                    temp = vm.ontologies;
                    vm.current = { oi: temp.length - 1, ci: undefined, pi: undefined };
                    vm.selected = temp[temp.length - 1];
                }
                // updates context if ontology was changed for the case where the id has a prefix set
                if(pi === undefined && ci === undefined && oi !== undefined && oi !== -1) {
                    // sets up old and fresh for updateRefs function
                    var old = vm.versions[oi][vm.versions[oi].length - 2].ontology['@id'],
                        fresh = changed['@id'];
                    // makes sure old is not empty string
                    if(old !== '') {
                        _updateRefs(vm.ontologies[oi].context, old, fresh);
                        _updateRefs(vm.ontologies[oi], old, fresh);
                    }
                }
                // it is now saved so, set unsaved to false
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
                i = vm.selected.context.length;
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
            var temp = vm.ontologies[vm.current.oi],
                i = temp.context.length;
            while(i--) {
                if(temp.context[i].key === key) {
                    _updateRefs(temp, key + ':', temp.context[i].value);
                    temp.context.splice(i, 1);
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

        // checks to see if the string is already taken
        function isTaken() {
            // defaults the result to false
            var arr, fresh,
                result = false;
            // if something is currently selected
            if(vm.current.oi && Object.keys(vm.current).length && Object.keys(vm.selected).length && vm.current.oi !== -1) {
                // gets array of taken names
                arr = vm.ontologies[vm.current.oi].taken;
                // gets the new name
                fresh = vm.selected['@id'];
                // sets the result to see if the value is already being used and isn't the one currently selected
                result = arr.indexOf(fresh) !== -1 && vm.original !== fresh;
            }
            // returns the result
            return result;
        }

        // show the upload ontology form on the right side
        function uploadClicked() {
            vm.shown = 'upload-form';
            vm.current = {};
            _saveState();
        }

        // upload ontology
        function uploadOntology(isValid, file, namespace, localName) {
            if(isValid && file) {
                // show the spinner
                vm.showSpinner = true;
                // sets up the configurations for the post method
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                // adds the data to the FormData
                fd.append('file', file);
                fd.append('namespace', namespace);
                fd.append('localName', localName);
                // uploads the ontology file
                $http.post('/matonto/rest/ontology/uploadOntology', fd, config)
                    .success(function(data) {
                        console.log('success', data);
                    })
                    .error(function(data) {
                        console.log('error', data);
                    })
                    .then(function() {
                        vm.showSpinner = false;
                    });
            }
        }
    }
})();
