/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
            this.element = $compile(angular.element('<drag-file files="files" on-drop="onDrop()"></drag-file>'))(scope);
            scope.$apply();
            this.controller = this.element.controller('dragFile');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        beforeEach(function() {
            this.compile();
        });
        it('files should be two way bound', function() {
            this.controller.files = ['new'];
            scope.$apply();
            expect(scope.files).toEqual(['new']);
        });
    });
    describe('in isolated scope', function() {
        beforeEach(function() {
            this.compile();
            this.isolatedScope = this.element.isolateScope();
        });
        it('onDrop is called in the parent scope', function() {
            this.isolatedScope.onDrop();
            scope.$apply();
            expect(scope.onDrop).toHaveBeenCalled();
        });
    });
    describe('replaces the directive with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('drag-file')).toBe(true);
        });
        _.forEach(['inner-container', 'fa-cloud-upload'], function(item) {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        _.forEach(['small', 'file-input'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with ps', function() {
            expect(this.element.find('p').length).toBe(2);
        });
    });
    it('properly sets controller.files if it is not an array', function() {
        scope.files = undefined;
        this.compile();
        expect(this.controller.files).toEqual([]);
    });
    it('adds controller.inputFiles to controller.files when they are changed', function() {
        this.compile();
        this.controller.inputFiles = ['inputFile', 'inputFile2'];
        scope.$apply();
        this.controller.files = ['inputFile', 'inputFile2'];
        expect(scope.onDrop).toHaveBeenCalled();
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
        expect(scope.onDrop).toHaveBeenCalled();
    });
    it('dragleave should remove the hover class', function() {
        this.compile();
        this.element.addClass('hover');
        this.element.triggerHandler('dragleave');
        expect(this.element.hasClass('hover')).toBe(false);
    });
});