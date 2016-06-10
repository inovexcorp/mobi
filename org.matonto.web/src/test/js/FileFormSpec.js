describe('File Form directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('fileForm');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/fileForm/fileForm.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.errorMessage = '';
            scope.onUploadClick = jasmine.createSpy('onUploadClick');
            scope.onContinueClick = jasmine.createSpy('onContinueClick');
            scope.delimitedFile = {};
            scope.separator = '';
            scope.containsHeaders = true;

            this.element = $compile(angular.element('<file-form error-message="errorMessage" on-upload-click="onUploadClick()" on-continue-click="onContinueClick()" delimited-file="delimitedFile" separator="separator" contains-headers="containsHeaders"></file-form>'))(scope);
            scope.$digest();
        });

        it('errorMessage should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.errorMessage = 'test';
            scope.$digest();
            expect(scope.errorMessage).toEqual('test');
        });
        it('onUploadClick should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onUploadClick();

            expect(scope.onUploadClick).toHaveBeenCalled();
        });
        it('onContinueClick should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onContinueClick();

            expect(scope.onContinueClick).toHaveBeenCalled();
        });
        it('delimitedFile should be two way bound', function() {
            var controller = this.element.controller('fileForm');
            controller.delimitedFile = {name: ''};
            scope.$digest();
            expect(scope.delimitedFile).toEqual({name: ''});
        });
        it('separator should be two way bound', function() {
            var controller = this.element.controller('fileForm');
            controller.separator = 'test';
            scope.$digest();
            expect(scope.separator).toEqual('test');
        });
        it('containsHeaders should be two way bound', function() {
            var controller = this.element.controller('fileForm');
            controller.containsHeaders = false;
            scope.$digest();
            expect(scope.containsHeaders).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should test whether delimitedFile is an Excel File', function() {
            scope.delimitedFile = {};
            var element = $compile(angular.element('<file-form error-message="errorMessage" on-upload-click="onUploadClick()" on-continue-click="onContinueClick()" delimited-file="delimitedFile" separator="separator" contains-headers="containsHeaders"></file-form>'))(scope);
            scope.$digest();
            var controller = element.controller('fileForm');
            var result = controller.isExcel();
            expect(result).toBe(false);

            controller.delimitedFile = {name: 'test.xls'};
            scope.$digest();
            result = controller.isExcel();
            expect(result).toBe(true);

            controller.delimitedFile = {name: 'test.xlsx'};
            scope.$digest();
            result = controller.isExcel();
            expect(result).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.errorMessage = '';
            scope.onUploadClick = jasmine.createSpy('onUploadClick');
            scope.onContinueClick = jasmine.createSpy('onContinueClick');
            scope.delimitedFile = undefined;
            scope.separator = '';
            scope.containsHeaders = true;

            this.element = $compile(angular.element('<file-form error-message="errorMessage" on-upload-click="onUploadClick()" on-continue-click="onContinueClick()" delimited-file="delimitedFile" separator="separator" contains-headers="containsHeaders"></file-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-form')).toBe(true);
        });
        it('with a file input', function() {
            expect(this.element.find('file-input').length).toBe(1);
        });
        it('depending on whether there is an error message', function() {
            var fileInputGroup = angular.element(this.element.querySelectorAll('.file-input-group')[0]);
            expect(fileInputGroup.hasClass('has-error')).toBe(false);
            expect(this.element.querySelectorAll('.error-msg').length).toBe(0);

            scope.errorMessage = 'test';
            scope.$digest();
            expect(fileInputGroup.hasClass('has-error')).toBe(true);
            expect(this.element.querySelectorAll('.error-msg').length).toBe(1);
        });
        it('depending whether a file has been uploaded', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Upload');
            expect(this.element.querySelectorAll('span.help-block').length).toBe(1);

            this.element.controller('fileForm').uploaded = true;
            scope.$digest();
            buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Update', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Update', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
            expect(this.element.querySelectorAll('span.help-block').length).toBe(2);
        });
        it('depending on the type of file', function() {
            scope.delimitedFile = {name: 'test.csv'};
            scope.$digest();
            expect(this.element.querySelectorAll('input[type=radio]').length).toBe(3);

            scope.delimitedFile = {name: 'test.xls'};
            scope.$digest();
            expect(this.element.querySelectorAll('input[type=radio]').length).toBe(0);
        })
    });
});