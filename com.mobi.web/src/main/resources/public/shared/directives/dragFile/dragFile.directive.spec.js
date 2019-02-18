describe('Drag File directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('dragFile');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.onDrop = jasmine.createSpy('onDrop');
        scope.files = [];
    });

    beforeEach(function helpers() {
        this.createEvent = function(type) {
            return { type: type, preventDefault: jasmine.createSpy('preventDefault')};
        }
        this.compile = function() {
            this.element = $compile(angular.element('<div drag-file="files" on-drop="onDrop()"></div>'))(scope);
            scope.$apply();
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('adds the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('drag-file-container')).toBe(true);
            expect(this.element.querySelectorAll('.drag-file').length).toBe(1);
        });
    });
    it('dragenter should call correct method', function() {
        this.compile();
        var event = this.createEvent('dragenter');
        this.element.triggerHandler(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });
    describe('dragover should add the hover class when dataTransfer files is', function() {
        beforeEach(function() {
            this.compile();
        });
        it('empty', function() {
            var event = this.createEvent('dragover');
            this.element.triggerHandler(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(this.element.hasClass('hover')).toBe(false);
        });
        it('populated', function() {
            var event = this.createEvent('dragover');
            event.dataTransfer = { items: [{}] };
            this.element.triggerHandler(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(this.element.hasClass('hover')).toBe(true);
        });
    });
    it('drop should remove class and call correct methods', function() {
        this.compile();
        var event = this.createEvent('drop');
        event.dataTransfer = { files: [{}] };
        this.element.addClass('hover');
        this.element.triggerHandler(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(this.element.hasClass('hover')).toBe(false);
        expect(scope.files).toEqual([{}]);
        expect(scope.onDrop).toHaveBeenCalled();
    });
    it('dragleave should remove the hover class', function() {
        this.compile();
        this.element.addClass('hover');
        this.element.triggerHandler('dragleave');
        expect(this.element.hasClass('hover')).toBe(false);
    });
});