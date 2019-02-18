describe('New Dataset Overlay component', function() {
    var $compile, scope, $q, datasetManagerSvc, datasetStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('newDatasetOverlay');
        mockDatasetManager();
        mockDatasetState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _datasetManagerService_, _datasetStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            utilSvc = _utilService_;
        });

        scope.dismiss = jasmine.createSpy('dismiss');
        scope.close = jasmine.createSpy('close');
        this.element = $compile(angular.element('<new-dataset-overlay close="close()" dismiss="dismiss()"></new-dataset-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newDatasetOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetManagerSvc = null;
        datasetStateSvc = null;
        utilSvc = null;
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
        it('should select an ontology', function() {
            var ontology = {title: 'A', selected: true};
            this.controller.selectedOntologies = [{title: 'B'}]
            this.controller.selectOntology(ontology)
            expect(this.controller.selectedOntologies).toEqual([ontology, {title: 'B'}]);
        });
        it('should unselect an ontology', function() {
            var ontology = {recordId: 'id'};
            this.controller.selectedOntologies = [ontology];
            this.controller.unselectOntology(ontology);
            expect(this.controller.selectedOntologies).toEqual([]);
        });
        describe('should create a dataset', function() {
            beforeEach(function() {
                this.controller.keywords = ['a ', ' b', 'c d'];
                this.controller.selectedOntologies = [{recordId: 'ontology1'}, {recordId: 'ontology2'}];
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.createDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.create();
                scope.$apply();
                expect(this.controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(this.controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(this.controller.recordConfig);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('Error Message');
            });
            it('successfully', function() {
                this.controller.create();
                scope.$apply();
                expect(this.controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(this.controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(this.controller.recordConfig);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(datasetStateSvc.setResults).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(this.controller.error).toBe('');
            });
        });
        it('should close the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('NEW-DATASET-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with text-inputs', function() {
            expect(this.element.find('text-input').length).toBe(2);
        });
        ['text-area', 'keyword-select', 'datasets-ontology-picker'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
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
    it('should call create when the button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
});
