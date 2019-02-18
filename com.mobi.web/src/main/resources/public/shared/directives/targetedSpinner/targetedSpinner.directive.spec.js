describe('Targeted Spinner directive', function() {
    var $compile, scope, httpSvc;

    beforeEach(function() {
        module('targetedSpinner');
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _httpService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            httpSvc = _httpService_;
        });

        httpSvc.pending = [];
        scope.id = 'id';
    });

    beforeEach(function compile() {
        this.compile = function(html) {
            this.element = $compile(angular.element(html))(scope);
            scope.$digest();
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        httpSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct value for cancelOnDestroy', function() {
        this.compile('<div targeted-spinner=""></div>');
        expect(scope.cancelOnDestroy).toBe(false);

        this.compile('<div targeted-spinner="" cancel-on-destroy></div>');
        expect(scope.cancelOnDestroy).toBe(true);
    });
    it('should initialize with the correct value for small', function() {
        this.compile('<div targeted-spinner=""></div>');
        expect(scope.small).toBe(false);

        this.compile('<div targeted-spinner="" cancel-on-destroy small></div>');
        expect(scope.small).toBe(true);
    });
    it('should clean up tracker when scope is destroyed', function() {
        this.compile('<div targeted-spinner="id" cancel-on-destroy></div>');
        scope.$destroy();
        expect(httpSvc.cancel).toHaveBeenCalledWith('id');
    });
});
