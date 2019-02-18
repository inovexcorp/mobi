describe('Run Mapping Download Overlay component', function() {
    var $compile, scope, $q, mapperStateSvc, delimitedManagerSvc, camelCase;

    beforeEach(function() {
        module('templates');
        module('runMappingDownloadOverlay');
        injectCamelCaseFilter();
        injectHighlightFilter();
        injectTrustedFilter();
        mockMapperState();
        mockDelimitedManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mapperStateService_, _delimitedManagerService_, _camelCaseFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            camelCase = _camelCaseFilter_;
        });

        camelCase.and.callFake(_.identity);
        mapperStateSvc.mapping = {record: {title: 'record'}, jsonld: []};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<run-mapping-download-overlay close="close()" dismiss="dismiss()"></run-mapping-download-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('runMappingDownloadOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        camelCase = null;
        this.element.remove();
    });

    it('should initialize with the correct values for fileName', function() {
        expect(this.controller.fileName).toBe(mapperStateSvc.mapping.record.title + '_Data');
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
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                this.step = mapperStateSvc.step;
            });
            describe('if it is also being saved', function() {
                describe('and there are changes', function() {
                    beforeEach(function() {
                        mapperStateSvc.editMapping = true;
                        mapperStateSvc.isMappingChanged.and.returnValue(true);
                    });
                    it('unless an error occurs', function() {
                        mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(this.step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(scope.close).not.toHaveBeenCalled();
                        expect(this.controller.errorMessage).toEqual('Error message');
                    });
                    it('successfully downloading the data', function() {
                        this.newId = 'id';
                        mapperStateSvc.saveMapping.and.returnValue($q.when(this.newId));
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(mapperStateSvc.mapping.record.id).toEqual(this.newId);
                        expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(this.newId, this.controller.format, this.controller.fileName);
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                        expect(this.controller.errorMessage).toEqual('');
                    });
                });
                it('and there are no changes and downloads the data', function() {
                    mapperStateSvc.isMappingChanged.and.returnValue(false);
                    this.controller.run();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.format, this.controller.fileName);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                });
            });
            it('if it is not being saved and downloads the data', function() {
                mapperStateSvc.editMapping = false;
                this.controller.run();
                expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                expect(delimitedManagerSvc.mapAndDownload).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.format, this.controller.fileName);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RUN-MAPPING-DOWNLOAD-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['text-input', 'mapper-serialization-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with buttons for cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$setValidity('required', false);
            this.controller.fileName = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call run when the run button is clicked', function() {
        spyOn(this.controller, 'run');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.run).toHaveBeenCalled();
    });
});