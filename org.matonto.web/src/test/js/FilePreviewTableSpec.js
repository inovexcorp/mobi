describe('File Preview Table directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('filePreviewTable');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/filePreviewTable/filePreviewTable.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.headers = [];
            scope.rows = [];
            scope.availableColumns = [];
            scope.highlightIdx = undefined;
            scope.isClickable = false;
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
            scope.$digest();
        });

        it('headers should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.headers = ['test'];
            scope.$digest();
            expect(scope.headers).toEqual(['test']);
        });
        it('rows should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.rows = [['test']];
            scope.$digest();
            expect(scope.rows).toEqual([['test']]);
        });
        it('availableColumns should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.availableColumns = ['test'];
            scope.$digest();
            expect(scope.availableColumns).toEqual(['test']);
        });
        it('highlightIdx should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.highlightIdx = 1;
            scope.$digest();
            expect(scope.highlightIdx).toEqual(1);
        });
        it('isClickable should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isClickable = true;
            scope.$digest();
            expect(scope.isClickable).toEqual(true);
        });
        it('onClick should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClick();

            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should set the correct values for toggling the table', function() {
            scope.rows = [[''], [''], [''], [''], [''], ['']];
            var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
            scope.$digest();
            var controller = element.controller('filePreviewTable');
            expect(controller.big).toBe(false);

            controller.toggleTable();
            scope.$digest();
            expect(controller.big).toBe(true);

            controller.toggleTable();
            scope.$digest();
            expect(controller.big).toBe(false);
            expect(controller.showNum).toBe(5);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.headers = [''];
            scope.rows = [[''], [''], [''], [''], ['']];
            scope.availableColumns = [''];
            scope.highlightIdx = 0;
            scope.isClickable = false;
            this.element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-preview-table')).toBe(true);
            expect(this.element.querySelectorAll('table.table').length).toBe(1);
        });
        it('with the correct classes depending on table size', function() {
            var controller = this.element.controller('filePreviewTable');
            var icon = angular.element(this.element.querySelectorAll('.toggle-table i')[0]);
            expect(icon.hasClass('fa-expand')).toBe(true);
            expect(icon.hasClass('fa-compress')).toBe(false);
            expect(this.element.hasClass('big')).toBe(false);

            controller.big = true;
            scope.$digest();
            expect(icon.hasClass('fa-expand')).toBe(false);
            expect(icon.hasClass('fa-compress')).toBe(true);
            expect(this.element.hasClass('big')).toBe(true);
        });
        it('with the correct number of rows depending on the number to show', function() {
            var controller = this.element.controller('filePreviewTable');
            scope.rows = [[''], [''], [''], [''], [''], ['']];
            scope.$digest();
            expect(this.element.querySelectorAll('tbody tr:not(.hidden)').length).toBe(5);

            controller.showNum = scope.rows.length;
            scope.$digest();
            expect(this.element.querySelectorAll('tbody tr:not(.hidden)').length).toBe(scope.rows.length);
        });
        it('with the correct classes if clickable', function() {
            var items = this.element.querySelectorAll('th, td');
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(false);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(false);
            }
            scope.isClickable = true;
            scope.$digest();
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(true);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(false);
            }
            scope.availableColumns = [];
            scope.$digest();
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(false);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(true);
            }
        });
        it('with the correct table data', function() {
            expect(this.element.find('th').length).toBe(scope.headers.length);
            var rows = this.element.querySelectorAll('tbody tr');
            expect(rows.length).toBe(scope.rows.length);
            expect(rows[0].querySelectorAll('td').length).toBe(scope.rows[0].length);
        });
        it('with the correct column highlighted', function() {
            expect(angular.element(this.element.find('th')[scope.highlightIdx]).hasClass('highlight')).toBe(true);
            var rows = this.element.querySelectorAll('tbody tr');
            for (var i = 0; i <  rows.length; i++) {
                var items = rows[i].querySelectorAll('td');
                expect(angular.element(items[scope.highlightIdx]).hasClass('highlight')).toBe(true);
            }
        });
        it('with the correct class for the button if last column is highlighted', function() {
            var controller = this.element.controller('filePreviewTable');
            var button = angular.element(this.element.querySelectorAll('.toggle-table')[0]);
            expect(button.hasClass('opposite')).toBe(false);

            controller.hoverIdx = 0;
            scope.$digest();
            expect(button.hasClass('opposite')).toBe(true);
        });
    });
    it('should call toggleTable when button is clicked', function() {
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
        scope.$digest();
        var controller = element.controller('filePreviewTable');
        spyOn(controller, 'toggleTable').and.callThrough();

        angular.element(element.find('button')).triggerHandler('click');
        scope.$digest();
        expect(controller.toggleTable).toHaveBeenCalled();
    });
    it('should highlight columns on hover of th', function() {
        scope.headers = [''];
        scope.rows = [[''], [''], [''], [''], ['']];
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
        scope.$digest();
        var controller = element.controller('filePreviewTable');
        var tableHeader = angular.element(element.find('th')[0]);
        tableHeader.triggerHandler('mouseover');
        scope.$digest();
        expect(controller.hoverIdx).toBe(0);
        expect(tableHeader.hasClass('highlight')).toBe(true);
        var rows = element.querySelectorAll('tbody tr');
        for (var i = 0; i < rows.length; i++) {
            var items = rows[i].querySelectorAll('td');
            expect(angular.element(items[0]).hasClass('highlight')).toBe(true);
        }

        tableHeader.triggerHandler('mouseleave');
        scope.$digest();
        expect(controller.hoverIdx).toBe(undefined);
        expect(tableHeader.hasClass('highlight')).toBe(false);
        for (var i = 0; i < rows.length; i++) {
            var items = rows[i].querySelectorAll('td');
            expect(angular.element(items[0]).hasClass('highlight')).toBe(false);
        }
    });
    it('should highlight columns on hover of td', function() {
        scope.headers = [''];
        scope.rows = [[''], [''], [''], [''], ['']];
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
        scope.$digest();
        var controller = element.controller('filePreviewTable');
        var dataItem = angular.element(element.querySelectorAll('td')[0]);
        dataItem.triggerHandler('mouseover');
        scope.$digest();
        expect(controller.hoverIdx).toBe(0);
        expect(angular.element(element.find('th')[0]).hasClass('highlight')).toBe(true);
        var rows = element.querySelectorAll('tbody tr');
        for (var i = 0; i < rows.length; i++) {
            var items = rows[i].querySelectorAll('td');
            expect(angular.element(items[0]).hasClass('highlight')).toBe(true);
        }

        dataItem.triggerHandler('mouseleave');
        scope.$digest();
        expect(controller.hoverIdx).toBe(undefined);
        expect(angular.element(element.find('th')[0]).hasClass('highlight')).toBe(false);
        for (var i = 0; i < rows.length; i++) {
            var items = rows[i].querySelectorAll('td');
            expect(angular.element(items[0]).hasClass('highlight')).toBe(false);
        }
    });
    it('should call onClick when a th or td is clicked', function() {
        scope.headers = [''];
        scope.rows = [[''], [''], [''], [''], ['']];
        scope.availableColumns = [''];
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" available-columns="availableColumns" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)"></file-preview-table>'))(scope);
        scope.$digest();
        angular.element(element.find('th')[0]).triggerHandler('click');
        expect(scope.onClick).not.toHaveBeenCalled();

        scope.isClickable = true;
        scope.$digest();
        angular.element(element.find('th')[0]).triggerHandler('click');
        expect(scope.onClick).toHaveBeenCalledWith(0);

        scope.onClick.calls.reset();
        angular.element(element.find('td')[0]).triggerHandler('click');
        scope.$digest();
        expect(scope.onClick).toHaveBeenCalledWith(0);
    });
});