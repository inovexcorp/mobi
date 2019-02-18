describe('Tabset directive', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('tabset');
        injectTrustedFilter();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        this.element = $compile(angular.element('<tabset></tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('tabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('tabset')).toBe(true);
        });
        it('with a .tabset-headings', function() {
            expect(this.element.querySelectorAll('.tabset-headings').length).toBe(1);
        });
        it('depending on the number of tabs', function() {
            this.controller.tabs = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.heading').length).toBe(1);
        });
        it('with a .tabset-contents', function() {
            expect(this.element.querySelectorAll('.tabset-contents').length).toBe(1);
        });
        describe('if tab.marked is', function() {
            it('true', function() {
                this.controller.tabs = [{id: 'tab1', marked: true}];
                scope.$digest();
                expect(this.element.querySelectorAll('.marked').length).toBe(1);
            });
            it('false', function() {
                this.controller.tabs = [{id: 'tab1', marked: false}];
                scope.$digest();
                expect(this.element.querySelectorAll('.marked').length).toBe(0);
            });
        });
        describe('if tab.hideTab is', function() {
            it('true', function() {
                this.controller.tabs = [{id: 'tab1', hideTab: true}];
                scope.$digest();
                expect(this.element.querySelectorAll('.heading').length).toEqual(0);
            });
            it('false', function() {
                this.controller.tabs = [{id: 'tab1', hideTab: false}];
                scope.$digest();
                var tabs = this.element.querySelectorAll('.heading');
                expect(tabs.length).toEqual(1);
                expect(angular.element(tabs[0]).hasClass('hide')).toEqual(false);
            });
        });
    });
    describe('controller methods', function() {
        it('addTab adds an element to the array', function() {
            this.controller.addTab({});
            expect(this.controller.tabs.length).toBe(1);
        });
        it('removeTab removes an element from the array', function() {
            var tab = {id: 'tab1'};
            this.controller.tabs = [tab];
            this.controller.removeTab(tab);
            expect(this.controller.tabs).not.toContain(tab);
        });
        it('select sets the active property to true for passed in tab and false for the others and calls onClick', function() {
            var tab1 = {id: 'tab1', active: true, onClick: jasmine.createSpy('onClick')};
            var tab2 = {id: 'tab2', active: false, onClick: jasmine.createSpy('onClick')};
            this.controller.tabs = [tab1, tab2];
            this.controller.select(tab2);
            $timeout.flush();
            expect(_.find(this.controller.tabs, {id: 'tab1'}).active).toBe(false);
            expect(_.find(this.controller.tabs, {id: 'tab2'}).active).toBe(true);
            expect(tab2.onClick).toHaveBeenCalled();
        });
    });
});
