describe('Mapping Name Input directive', function() {
    var $compile,
        scope,
        mappingManagerSvc;

    mockMappingManager();
    beforeEach(function() {
        module('mappingNameInput');

        inject(function(mappingManagerService) {
            mappingManagerSvc = mappingManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/mappingNameInput/mappingNameInput.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.name = '';
            scope.required = true;

            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<mapping-name-input name="name" required="required"></mapping-name-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });

        it('name should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = 'test';
            scope.$digest();
            expect(scope.name).toBe('test');
        });
        it('required should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.previousMappingNames = ['test'];
            scope.name = '';
            scope.required = true;

            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<mapping-name-input name="name" required="required"></mapping-name-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-input')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with the correct classes based on the input field validity', function() {
            expect(this.element.hasClass('has-error')).toBe(true);
            var isolatedScope = this.element.isolateScope();

            isolatedScope.name = 'a';
            scope.$digest();
            expect(this.element.hasClass('has-success')).toBe(true);
        });
        it('with the correct error message for invalid characters', function() {
            var isolatedScope = this.element.isolateScope();
            var invalidChars = ['$', '@', '~', '`', '$', '%', '^', '&', '*', '(', ')', '#', '!', '=', '+', '[', ']', '{', '}', ';', ':', '>', '<', ',', '?', '|', '/', '\'', '\"'];
            invalidChars.forEach(function(invalidChar) {
                isolatedScope.name = invalidChar;
                scope.$digest();
                var errorMessages = this.element.querySelectorAll('.alert');
                expect(errorMessages.length).toBe(1);
                expect(angular.element(errorMessages[0]).text().trim()).toBe('Mapping name is invalid');
            }, this);
        });
        it('with the correct error message if input is a previous mapping name', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = mappingManagerSvc.previousMappingNames[0];
            scope.$digest();
            var errorMessages = this.element.querySelectorAll('.alert');
            expect(errorMessages.length).toBe(1);
            expect(angular.element(errorMessages[0]).text().trim()).toBe('Mapping name must be unique');
        });
        it('with the correct error message if input is longer than 50 characters', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.name = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
            scope.$digest();
            var errorMessages = this.element.querySelectorAll('.alert');
            expect(errorMessages.length).toBe(1);
            expect(angular.element(errorMessages[0]).text().trim()).toBe('Mapping name must be 50 characters or less');
        });
    });
    it('should not show an error if first name passed is a previous mapping name', function() {
        mappingManagerSvc.previousMappingNames = ['test'];
        scope.name = 'test';
        var form = $compile('<form></form>')(scope);
        var element = angular.element('<mapping-name-input name="name" required="required"></mapping-name-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();

        var errorMessages = element.querySelectorAll('.alert');
        expect(errorMessages.length).toBe(0);
    });
});