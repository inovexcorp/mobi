describe('RDF Preview Form directive', function() {
    var $compile, scope, $q, delimitedManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('rdfPreviewForm');
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_, _mapperStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
            mapperStateSvc = _mapperStateService_;
            $q = _$q_;
        });

        mapperStateSvc.mapping = {jsonld: []};
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<rdf-preview-form></rdf-preview-form>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('rdfPreviewForm');
        };
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        delimitedManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        describe('should generate an RDF preview', function() {
            it('unless an error occurs', function() {
                delimitedManagerSvc.previewMap.and.returnValue($q.reject('Error message'));
                this.compile();
                this.controller.generatePreview();
                scope.$apply();
                expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                expect(delimitedManagerSvc.preview).toBe('');
                expect(this.controller.errorMessage).toBe('Error message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    this.preview = '';
                    delimitedManagerSvc.previewMap.and.returnValue($q.when(this.preview));
                });
                it('if format is JSON-LD', function() {
                    delimitedManagerSvc.serializeFormat = 'jsonld';
                    this.compile();
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toBe('application/ld+json');
                    expect(delimitedManagerSvc.preview).toBe(JSON.stringify(this.preview));
                });
                it('if format is turtle', function() {
                    delimitedManagerSvc.serializeFormat = 'turtle';
                    this.compile();
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toBe('text/turtle');
                    expect(delimitedManagerSvc.preview).toBe(this.preview);
                });
                it('if format is RDF/XML', function() {
                    delimitedManagerSvc.serializeFormat = 'rdf/xml';
                    this.compile();
                    this.controller.generatePreview();
                    scope.$apply();
                    expect(delimitedManagerSvc.previewMap).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.controller.serializeFormat);
                    expect(this.controller.editorOptions.mode).toBe('application/xml');
                    expect(delimitedManagerSvc.preview).toBe(this.preview);
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('rdf-preview-form')).toBe(true);
            expect(this.element.querySelectorAll('.select-container').length).toBe(1);
            expect(this.element.querySelectorAll('.codemirror-wrapper').length).toBe(1);
        });
        it('with a mapper serialization select', function() {
            expect(this.element.find('mapper-serialization-select').length).toBe(1);
        });
        it('with a ui codemirror', function() {
            expect(this.element.find('ui-codemirror').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
    });
    it('should call generatePreview when the Refresh button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'generatePreview');
        angular.element(this.element.querySelectorAll('.select-container button')).triggerHandler('click');
        expect(this.controller.generatePreview).toHaveBeenCalled();
    });
});
