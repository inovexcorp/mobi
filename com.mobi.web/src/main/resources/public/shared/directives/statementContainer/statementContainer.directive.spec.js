describe('Statement Container directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('statementContainer');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<statement-container></statement-container>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('statement-container')).toBe(true);
        });
        it('without a p', function() {
            expect(this.element.find('p').length).toBe(0);
        });
        it('with a p when additions attribute is set', function() {
            this.element = $compile(angular.element('<statement-container additions></statement-container>'))(scope);
            scope.$digest();
            expect(this.element.find('p').length).toBe(1);
            expect(angular.element(this.element.find('p')[0]).text()).toBe('Added Statements:');
        });
        it('with a p when deletions attribute is set', function() {
            this.element = $compile(angular.element('<statement-container deletions></statement-container>'))(scope);
            scope.$digest();
            expect(this.element.find('p').length).toBe(1);
            expect(angular.element(this.element.find('p')[0]).text()).toBe('Deleted Statements:');
        });
        it('with a table', function() {
            expect(this.element.find('table').length).toBe(1);
        });
        it('with a tbody', function() {
            expect(this.element.find('tbody').length).toBe(1);
        });
    });
});
