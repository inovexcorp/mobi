describe('Dataset Select directive', function() {
    var $compile, scope, datasetManagerSvc;

    beforeEach(function() {
        module('templates');
        module('datasetSelect');
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();
        mockDatasetManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetManagerSvc = _datasetManagerService_;
        });

        datasetManagerSvc.datasetRecords = [[]];
        datasetManagerSvc.splitDatasetArray.and.returnValue({});
        scope.bindModel = '';
        scope.onSelect = jasmine.createSpy('onSelect');
        this.element = $compile(angular.element('<dataset-select ng-model="bindModel" on-select="onSelect()"></dataset-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    it('initializes with the correct value for datasetRecords', function() {
        expect(this.controller.datasetRecords).toEqual([{}]);
    });
    describe('in isolated scope', function() {
        it('onChange should be called in parent scope', function() {
            this.element.isolateScope().onSelect();
            expect(scope.onSelect).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.element.controller('datasetSelect').bindModel = 'different';
            scope.$digest();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('dataset-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a ui-select-match', function() {
            expect(this.element.find('ui-select-match').length).toBe(1);
        });
        it('with a ui-select-choices', function() {
            expect(this.element.find('ui-select-choices').length).toBe(1);
        });
    });
});
