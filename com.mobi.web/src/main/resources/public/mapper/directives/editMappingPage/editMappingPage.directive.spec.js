describe('Edit Mapping Page directive', function() {
    var $compile, scope, $q, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('editMappingPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            modalSvc = _modalService_;
        });

        mapperStateSvc.mapping = {record: {id: 'Id', title: 'Title', description: 'Description', keywords: ['Keyword']}, jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editMappingPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should open the runMappingDownloadOverlay', function() {
            this.controller.runMappingDownload();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingDownloadOverlay', {}, undefined, 'sm');
        });
        it('should open the runMappingDatasetOverlay', function() {
            this.controller.runMappingDataset();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingDatasetOverlay', {}, undefined, 'sm');
        });
        it('should open the runMappingOntologyOverlay', function() {
            this.controller.runMappingOntology();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingOntologyOverlay');
        });
        describe('should set the correct state for saving a mapping', function() {
            beforeEach(function() {
                this.step = mapperStateSvc.step;
            });
            describe('if the mapping has changed', function() {
                beforeEach(function() {
                    mapperStateSvc.isMappingChanged.and.returnValue(true);
                });
                it('unless an error occurs', function() {
                    mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                    this.controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(this.step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    this.controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(this.controller.errorMessage).toBe('');
                });
            });
            it('if the mapping has not changed', function() {
                this.controller.save();
                expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(this.controller.errorMessage).toBe('');
            });
        });
        describe('should set the correct state for canceling', function() {
            it('if the mapping has been changed', function() {
                mapperStateSvc.isMappingChanged.and.returnValue(true);
                this.controller.cancel();
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), this.controller.reset);
            });
            it('if the mapping has not been changed', function() {
                this.controller.cancel();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(this.controller.errorMessage).toBe('');
            });
        });
        describe('should test whether the mapping is saveable when', function() {
            it('there are no class mappings and there are no invalid property mappings', function() {
                mappingManagerSvc.getAllClassMappings.and.returnValue([]);
                expect(this.controller.isSaveable()).toEqual(false);
            });
            it('there are class mappings and there are no invalid property mappings', function () {
                mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                expect(this.controller.isSaveable()).toEqual(true);
            });
            it('there are invalid property mappings', function() {
                mapperStateSvc.invalidProps = [{}];
                expect(this.controller.isSaveable()).toEqual(false);
            });
        });
        it('should set the correct state for reseting', function() {
            this.controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-mapping-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-5').length).toBe(1);
            expect(this.element.querySelectorAll('.col-7').length).toBe(1);
            expect(this.element.querySelectorAll('.edit-tabs').length).toBe(1);
        });
        ['mapping-title', 'tabset', 'edit-mapping-form', 'rdf-preview-form'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with two tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(3);
        });
        it('with buttons for canceling, saving, and saving and running', function() {
            var footers = this.element.querySelectorAll('tab block-footer');
            _.forEach(footers, footer => {
                var buttons = angular.element(footer).find('button');
                expect(buttons.length).toBe(6);
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[1]).text().trim());
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[2]).text().trim());
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[3]).text().trim());
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[4]).text().trim());
                expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[5]).text().trim());

            });
        });
        it('with disabled buttons if the mapping is not saveable', function() {
            spyOn(this.controller, 'isSaveable');
            scope.$digest();
            var buttons = _.toArray(this.element.querySelectorAll('tab block-footer button.btn-primary'));
            _.forEach(buttons, button => expect(angular.element(button).attr('disabled')).toBeTruthy());

            this.controller.isSaveable.and.returnValue(true);
            scope.$digest();
            _.forEach(buttons, button => expect(angular.element(button).attr('disabled')).toBeFalsy());
        });
    });
    it('should call cancel when a cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var cancelButtons = this.element.querySelectorAll('.cancel-mapping');
        _.toArray(cancelButtons).forEach(button => {
            this.controller.cancel.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(this.controller.cancel).toHaveBeenCalled();
        });
    });
    it('should call save when a save button is clicked', function() {
        spyOn(this.controller, 'save');
        var saveButtons = this.element.querySelectorAll('.save-btn');
        _.toArray(saveButtons).forEach(button => {
            this.controller.save.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(this.controller.save).toHaveBeenCalled();
        });
    });
    it('should set the correct state when a run download button is clicked', function() {
        spyOn(this.controller, 'runMappingDownload');
        var buttons = this.element.querySelectorAll('.run-download');
        _.toArray(buttons).forEach(button => {
            this.controller.runMappingDownload.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(this.controller.runMappingDownload).toHaveBeenCalled();
        });
    });
    it('should set the correct state when a run dataset button is clicked', function() {
        spyOn(this.controller, 'runMappingDataset');
        var buttons = this.element.querySelectorAll('.run-dataset');
        _.toArray(buttons).forEach(button => {
            this.controller.runMappingDataset.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(this.controller.runMappingDataset).toHaveBeenCalled();
        });
    });
    it('should set the correct state when a run ontology button is clicked', function() {
        spyOn(this.controller, 'runMappingOntology');
        var buttons = this.element.querySelectorAll('.run-ontology');
        _.toArray(buttons).forEach(button => {
            this.controller.runMappingOntology.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(this.controller.runMappingOntology).toHaveBeenCalled();
        });
    });
});
