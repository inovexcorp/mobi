describe('Entity Dates directive', function() {
    var $compile, scope, utilSvc, $filter;

    beforeEach(function() {
        module('templates');
        module('entityDates');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_, _$filter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            $filter = _$filter_;
        });

        scope.entity = {};
        this.element = $compile(angular.element('<entity-dates entity="entity"></entity-dates>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('entityDates');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        $filter = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('entity should be one way bound', function() {
            this.isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should get the specified date of an entity by calling the proper functions', function() {
            var date = '1/1/2000';
            utilSvc.getDctermsValue.and.returnValue(date);
            var result = this.controller.getDate({}, 'test');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({}, 'test');
            expect(utilSvc.getDate).toHaveBeenCalledWith(date, 'short');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('entity-dates')).toBe(true);
        });
        it('with fields for issued and modified date', function() {
            var fields = this.element.querySelectorAll('span.date');
            expect(fields.length).toBe(2);
            _.forEach(fields, function(field) {
                var f = angular.element(field);
                var text = f.text();
                expect(f.querySelectorAll('.field-name').length).toBe(1);
                expect(_.includes(text, 'Issued') || _.includes(text, 'Modified')).toBe(true);
            });
        });
    });
});