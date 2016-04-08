describe('File Preview Table directive', function() {
    var $compile,
        $timeout,
        scope;

    beforeEach(function() {
        module('filePreviewTable');

        inject(function(_$compile_, _$timeout_, _$rootScope_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/filePreviewTable/filePreviewTable.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.headers = [];
            scope.rows = [];
            scope.highlightIdx = undefined;
            scope.isClickable = false;
            scope.onClick = jasmine.createSpy('onClick');
            scope.tableHeight = undefined;

            this.element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
            scope.$digest();
            $timeout.flush();
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
        it('tableHeight should be two way bound', function() {
            var controller = this.element.controller('filePreviewTable');
            controller.tableHeight = 100;
            scope.$digest();
            expect(scope.tableHeight).toBe(100);
        });
    });
    describe('controller methods', function() {
        it('should set the correct values for toggling the table', function() {
            scope.rows = [[''], [''], [''], [''], [''], ['']];
            scope.tableHeight = undefined;
            this.element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
            scope.$digest();
            $timeout.flush();
            var controller = this.element.controller('filePreviewTable');
            expect(controller.big).toBe(false);
            expect(controller.containerTop).toBe('0px');
            expect(controller.containerHeight).toBe(controller.initialHeight + 'px');
            expect(controller.rows).toEqual(scope.rows.slice(0,5));

            controller.toggleTable();
            scope.$digest();
            var top = this.element[0].offsetTop;
            var height = this.element[0].parentNode.offsetHeight;
            expect(controller.big).toBe(true);
            expect(controller.containerTop).toBe(top + 'px');
            expect(controller.containerHeight).toBe(height + 'px');
            expect(controller.rows).toEqual(scope.rows);

            controller.toggleTable();
            scope.$digest();
            expect(controller.big).toBe(false);
            expect(controller.containerTop).toBe('0px');
            expect(controller.containerHeight).toBe(controller.initialHeight + 'px');
            expect(controller.rows).toEqual(scope.rows.slice(0,5));
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.headers = [''];
            scope.rows = [[''], [''], [''], [''], ['']];
            scope.highlightIdx = 0;
            scope.isClickable = false;
            this.element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.attr('id')).toBe('fixed-height-container');
            expect(this.element.querySelectorAll('#table-container').length).toBe(1);
            expect(this.element.querySelectorAll('#file-preview-container').length).toBe(1);
            expect(this.element.querySelectorAll('#toggle-table').length).toBe(1);
            expect(this.element.querySelectorAll('#file-preview').length).toBe(1);
        });
        it('with the correct classes depending on table size', function() {
            var controller = this.element.controller('filePreviewTable');
            var icon = angular.element(this.element.querySelectorAll('#toggle-table i')[0]);
            var previewContainer = angular.element(this.element.querySelectorAll('#file-preview-container')[0]);
            expect(icon.hasClass('fa-expand')).toBe(true);
            expect(icon.hasClass('fa-compress')).toBe(false);
            expect(previewContainer.hasClass('no-scroll')).toBe(true);
            expect(previewContainer.hasClass('scroll')).toBe(false);

            controller.big = true;
            controller.small = false;
            scope.$digest();
            expect(icon.hasClass('fa-expand')).toBe(false);
            expect(icon.hasClass('fa-compress')).toBe(true);
            expect(previewContainer.hasClass('no-scroll')).toBe(false);
            expect(previewContainer.hasClass('scroll')).toBe(true);
        });
        it('with the correct classes if clickable', function() {
            var items = this.element.querySelectorAll('th, td');
            for (var i = 0; i <  items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(false);                
            }
            scope.isClickable = true;
            scope.$digest();
            for (var i = 0; i <  items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(true);
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
    });
    it('should call toggleTable when button is clicked', function() {
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
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
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
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
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
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
        scope.isClickable = true;
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<file-preview-table headers="headers" rows="rows" highlight-idx="highlightIdx" is-clickable="isClickable" on-click="onClick(colIndex)" table-height="tableHeight"></file-preview-table>'))(scope);
        scope.$digest();
        angular.element(element.find('th')[0]).triggerHandler('click');
        scope.$digest();
        expect(scope.onClick).toHaveBeenCalledWith(0);
        
        scope.onClick.calls.reset();
        angular.element(element.find('td')[0]).triggerHandler('click');
        scope.$digest();
        expect(scope.onClick).toHaveBeenCalledWith(0);
    });
});