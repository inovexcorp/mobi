describe('Mapper Serialization Select directive', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mapperSerializationSelect');
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        scope.format = 'jsonld';
        this.element = $compile(angular.element('<mapper-serialization-select format="format"></mapper-serialization-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mapperSerializationSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('in insolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('format should be two way bound', function() {
            this.isolatedScope.format = 'test';
            scope.$digest();
            expect(scope.format).toBe('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SELECT');
            expect(this.element.hasClass('mapper-serialization-select')).toBe(true);
        });
        it('with the correct options', function() {
            var options = this.element.find('option');
            expect(options.length).toBe(this.controller.options.length);
            _.toArray(options).forEach(function(option) {
                var angularOption = angular.element(option);
                var optionObj = _.find(this.controller.options, {name: angularOption.text().trim()});
                expect(optionObj).toBeTruthy();
                expect(angularOption.attr('value')).toBe(optionObj.value);
            }, this);
        });
    });
});