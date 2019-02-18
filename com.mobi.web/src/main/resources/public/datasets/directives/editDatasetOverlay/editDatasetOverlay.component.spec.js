describe('Edit Dataset Overlay component', function() {
    var $compile, scope, $q, datasetStateSvc, datasetManagerSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('editDatasetOverlay');
        mockDatasetState();
        mockDatasetManager();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _datasetManagerService_, _catalogManagerService_, _utilService_, _$q_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        this.catalogId = 'catalog';
        utilSvc.getSkolemizedIRI.and.returnValue('http://mobi.com/.well-known/genid/1234');
        utilSvc.getPropertyId.and.callFake((entity, propertyIRI) => {
            switch (propertyIRI) {
                case prefixes.dataset + 'dataset':
                    return 'dataset';
                    break;
                case prefixes.dataset + 'linksToRecord':
                    return 'record';
                    break;
                case prefixes.catalog + 'head':
                    return 'commit';
                    break;
                default:
                    return '';
            }
        });
        utilSvc.getPropertyValue.and.returnValue('repository');
        utilSvc.getDctermsValue.and.callFake((entity, property) => {
            switch (property) {
                case 'title':
                    return 'title';
                    break;
                case 'description':
                    return 'description';
                    break;
                default:
                    return '';
            }
        });
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        datasetStateSvc.selectedDataset = {
            identifiers: [],
            record: {'@id': 'record'},
            [prefixes.catalog + 'keyword']: [{'@value': 'keyword'}]
        };
        this.expectedRecord = {
            '@id': datasetStateSvc.selectedDataset.record['@id'],
            [prefixes.dcterms + 'title']: [],
            [prefixes.dcterms + 'description']: [],
            [prefixes.catalog + 'keyword']: []
        };
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.close = jasmine.createSpy('close');
        this.element = $compile(angular.element('<edit-dataset-overlay close="close()" dismiss="dismiss()"></edit-dataset-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editDatasetOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetStateSvc = null;
        datasetManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilSvc.getPropertyId.and.returnValue('ontology')
            expect(this.controller.getOntologyIRI({})).toEqual('ontology');
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyEditor + 'ontologyIRI');
        });
        it('should select an ontology', function() {
            var ontology = {title: 'A', selected: true};
            this.controller.selectedOntologies = [{title: 'B'}]
            this.controller.selectOntology(ontology)
            expect(this.controller.selectedOntologies).toEqual([ontology, {title: 'B'}]);
        });
        it('should unselect an ontology', function() {
            var ontology = {recordId: this.ontology1Id};
            this.controller.selectedOntologies = [ontology];
            this.controller.unselectOntology(ontology);
            expect(this.controller.selectedOntologies).toEqual([]);
        });
        describe('should update a dataset', function() {
            it('unless an error occurs', function() {
                datasetManagerSvc.updateDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.update();
                scope.$apply();
                expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.catalogId, jasmine.any(Array), 'title');
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('Error Message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    datasetManagerSvc.updateDatasetRecord.and.returnValue($q.when());
                });
                it('updating title, description, and keywords', function() {
                    this.controller.update();
                    scope.$apply();
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'title', this.controller.recordConfig.title);
                    expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'description', this.controller.recordConfig.description);
                    _.forEach(datasetStateSvc.selectedDataset.record[prefixes.catalog + 'keyword'], function(obj) {
                        expect(utilSvc.setDctermsValue).toHaveBeenCalledWith(this.expectedRecord, 'keyword', obj['@value']);
                    });
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.catalogId, jasmine.any(Array), 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
                it('when all ontologies are removed.', function() {
                    datasetStateSvc.selectedDataset.identifier = [{'@id': 'identifier'}];
                    this.controller.update();
                    scope.$apply();
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.catalogId, [this.expectedRecord], 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
                it('when an ontology is added.', function() {
                    var branch = {'@id': 'branch'};
                    this.controller.selectedOntologies = [{recordId: 'ontology'}];
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when(branch));
                    var expectedBlankNode = {};
                    expectedBlankNode[prefixes.dataset + 'linksToRecord'] = [{'@id': 'ontology'}];
                    expectedBlankNode[prefixes.dataset + 'linksToBranch'] = [{'@id': 'branch'}];
                    expectedBlankNode[prefixes.dataset + 'linksToCommit'] = [{'@id': 'commit'}];
                    this.controller.update();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith('ontology', this.catalogId);
                    expect(utilSvc.getSkolemizedIRI).toHaveBeenCalled();
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(branch, prefixes.catalog + 'head');
                    expect(utilSvc.setPropertyId).toHaveBeenCalledWith(this.expectedRecord, prefixes.dataset + 'ontology', jasmine.any(String));
                    expect(datasetManagerSvc.updateDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.catalogId, [jasmine.objectContaining(expectedBlankNode), this.expectedRecord], 'title');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                    expect(this.controller.error).toBe('');
                });
            });
        });
        it('should close the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('EDIT-DATASET-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'text-input', 'text-area', 'keyword-select', 'datasets-ontology-picker'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with a .dataset-info', function() {
            expect(this.element.querySelectorAll('.dataset-info').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            this.controller.infoForm.$invalid = true;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.infoForm.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call update when the button is clicked', function() {
        spyOn(this.controller, 'update');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.update).toHaveBeenCalled();
    });
});
