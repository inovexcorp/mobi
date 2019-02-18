
describe('Record Icon component', function() {
    var $compile, scope, catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogState();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
        });

        catalogStateSvc.getRecordIcon.and.returnValue('fa-book');

        scope.record = {};
        this.element = $compile(angular.element('<record-icon record="record"></record-icon>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordIcon');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogStateSvc = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('with the icon of the record', function() {
            expect(catalogStateSvc.getRecordIcon).toHaveBeenCalledWith(scope.record);
            expect(this.controller.icon).toEqual('fa-book');
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            this.controller.record = {test: true};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-ICON');
        });
        it('with a square icon', function() {
            expect(this.element.querySelectorAll('.fa-square').length).toBe(1);
        });
        it('with an icon for the record', function() {
            expect(this.element.querySelectorAll('.fa-book').length).toBe(1);
        });
    });
});