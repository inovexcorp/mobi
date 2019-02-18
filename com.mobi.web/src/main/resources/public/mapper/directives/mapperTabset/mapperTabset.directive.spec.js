describe('Mapper Tabset directive', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mapperTabset');
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        this.element = $compile(angular.element('<mapper-tabset></mapper-tabset>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapper-tabset')).toBe(true);
        });
        describe('if the step', function() {
            it('is selecting a mapping', function() {
                mapperStateSvc.step = mapperStateSvc.selectMappingStep;
                scope.$digest();
                expect(this.element.find('mapping-select-page').length).toBe(1);
            });
            it('is uploading a file', function() {
                mapperStateSvc.step = mapperStateSvc.fileUploadStep;
                scope.$digest();
                expect(this.element.find('file-upload-page').length).toBe(1);
            });
            it('is editing a mapping', function() {
                mapperStateSvc.step = mapperStateSvc.editMappingStep;
                scope.$digest();
                expect(this.element.find('tabset').length).toBe(1);
                expect(this.element.find('tab').length).toBe(2);
                expect(this.element.find('edit-mapping-page').length).toBe(1);
            });
        });
    });
});