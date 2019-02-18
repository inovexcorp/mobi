describe('Commit Info Overlay directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('commitInfoOverlay');
        mockUserManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.resolve = {
            commit: {},
            additions: [],
            deletions: []
        };
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<commit-info-overlay resolve="resolve" dismiss="dismiss()"></commit-info-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitInfoOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('COMMIT-INFO-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(1);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(0);

            scope.resolve.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(1);

            scope.resolve.additions = [];
            scope.resolve.deletions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(1);
        });
        it('with a button to cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text().trim()).toBe('Cancel');
        });
    });
    describe('controller methods', function() {
        it('should cancel the overlay', function() {
            this.controller.cancel();
            scope.$digest();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});