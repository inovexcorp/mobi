describe('Catalog Page component', function() {
    var $compile, scope, catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'recordView');
        mockComponent('catalog', 'recordsView');
        mockCatalogState();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
        });

        this.element = $compile(angular.element('<catalog-page></catalog-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CATALOG-PAGE');
        });
        it('depending on whether a record is selected', function() {
            expect(this.element.find('records-view').length).toBe(1);
            expect(this.element.find('record-view').length).toBe(0);

            catalogStateSvc.selectedRecord = {};
            scope.$digest();
            expect(this.element.find('records-view').length).toBe(0);
            expect(this.element.find('record-view').length).toBe(1);
        });
    });
});