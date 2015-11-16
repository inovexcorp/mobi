(function() {
    'use strict';

    angular
        .module('app')
        .controller('MapperController', MapperController);

    MapperController.$inject = ['$http'];

    function MapperController($http) {
        var temp,
            vm = this;

        vm.another = false;
        vm.data = {};
        vm.selected = 'default';
        vm.mapping = 'default';
        vm.new = {type: 'default'};
        vm.dataSets = [];
        vm.readFile = readFile;
        vm.addDataSet = addDataSet;
        vm.cancelDataSet = cancelDataSet;
        vm.updateDataSetSelection = updateDataSetSelection;
        vm.addMapping = addMapping;
        vm.cancelMapping = cancelMapping;
        vm.updateMappingSelection = updateMappingSelection;
        vm.addProperty = addProperty;
        vm.cancelProperty = cancelProperty;
        vm.clearNew = clearNew;
        vm.initProperty = initProperty;

        activate();

        function activate() {

        }

        /* Adds the selected file data to the temp variable */
        function readFile() {
            // create the filereader to read the selected file
            var reader = new FileReader();

            // onload of the file, do this action
            reader.onload = function(event) {
                // gets the data and parses it into a usable format
                var data = event.target.result,
                    cfb = XLSX.CFB.read(data, {type: 'binary'}),
                    wb = XLSX.parse_xlscfb(cfb);

                // this assumes there is only one sheet we are working with
                // TODO: determine if we will need to handle multi-sheet excel files
                temp = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            }

            // read the file
            reader.readAsBinaryString(vm.file);
        }

        // adds the selected file to the datasets displayed
        function addDataSet() {
            // adds the selected dataset to the tool
            vm.dataSets.push({ name: vm.dataSetName, dataSet: temp });

            // sets selected to the latest value and the mapping to default
            vm.selected = (vm.dataSets.length - 1).toString();
            vm.mapping = 'default';

            // now do the cancel action to reset the overlay and close it
            cancelDataSet();
        }

        // closes the dataset overlay and resets the fields
        function cancelDataSet() {
            // hides the overlay
            vm.showDataSetOverlay = false;

            // resets the file selected
            vm.file = undefined;
            document.getElementById('source').value = '';

            // clears the DataSet name
            vm.dataSetName = '';

            // resets vm.selected if necessary
            if(vm.selected == 'new') vm.selected = 'default';
        }

        // determines what to do based on dataset dropdown selection
        function updateDataSetSelection() {
            if(vm.selected == 'new') {
                vm.showDataSetOverlay = true;
                vm.mapping = 'default';
            }
        }

        // adds the mapping to the dataset
        function addMapping() {
            // sets up needed variables
            var selected = vm.dataSets[vm.selected],
                item = {
                    name: vm.mappingName,
                    mapping: {
                        '@id': 'delim-data:' + vm.mappingName,
                        '@type': 'delim:ClassMapping',
                        'delim:hasPrefix': vm.new['delim:hasPrefix'],
                        'delim:mapsTo': {
                            '@id': vm.new['delim:mapsTo']
                        },
                        'delim:localName': vm.new['delim:localName'],
                        'delim:dataProperty': [],
                        'delim:objectProperty': []
                    }
                };

            // determines if this is the first mapping or not which will determine how it is added
            if(selected.hasOwnProperty('mappings')) {
                selected.mappings.push(item);
            } else {
                selected.mappings = [item];
            }

            // selects the created mapping
            vm.mapping = (vm.dataSets[vm.selected].mappings.length - 1).toString();

            // cancels the mapping overlay
            cancelMapping();
        }

        // closes the mapping overlay and resets the fields
        function cancelMapping() {
            vm.showMappingOverlay = false;

            // clears the mapping name
            vm.mappingName = '';

            // resets vm.selected if necessary
            if(vm.mapping == 'new') vm.mapping = 'default';
        }

        // determines what to do based on mapping dropdown selection
        function updateMappingSelection() {
            if(vm.mapping == 'new') {
                vm.showMappingOverlay = true;
            }
        }

        // adds the mapping property to the mapping object
        function addProperty() {
            // gets the current mapping object
            var prop,
                temp = {},
                mapping = vm.dataSets[vm.selected].mappings[vm.mapping].mapping,
                type = vm.new.type;
            for(prop in vm.new) {
                if(vm.new.hasOwnProperty(prop) && prop != 'type' && prop != 'name') {
                    temp[prop] = vm.new[prop];
                }
            }
            mapping[type].push({
                '@id': vm.new.name,
                'temp': temp
            });
            cancelProperty(vm.another, type);
        }

        // closes the mapping property modal
        function cancelProperty(addAnother, type) {
            // sets the new property details to the default value
            vm.new = { type: 'default' };

            // hides the overlay if you don't want to add another
            if(!addAnother) {
                vm.showPropertyOverlay = false;
            } else {
                vm.new.type = type;
                if(type == 'delim:objectProperty') {
                    vm.new['delim:classMapping'] = 'default';
                } else {
                    vm.new['delim:columnIndex'] = 'default';
                }
            }
        }

        // removes all of the properties except type
        function clearNew() {
            var prop;
            // iterates through all properties looking for type
            for(prop in vm.new) {
                if(vm.new.hasOwnProperty(prop) && prop != 'type') {
                    delete vm.new[prop];
                }
            }
            // adds the delim:hasProperty property to the new object
            if(vm.new.type == 'delim:dataProperty') {
                vm.new['delim:hasProperty'] = {};
                vm.new['delim:columnIndex'] = 'default';
            } else if(vm.new.type == 'delim:objectProperty') {
                vm.new['delim:hasProperty'] = {};
                vm.new['delim:classMapping'] = 'default';
            }
        }

        // initialize property overlay
        function initProperty(type) {
            vm.new.type = type;
            vm.showPropertyOverlay = true;
            vm.another = false;
            if(type == 'delim:dataProperty') {
                vm.new['delim:columnIndex'] = 'default';
            } else {
                vm.new['delim:classMapping'] = 'default';
            }
        }
    }
})();
