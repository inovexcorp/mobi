/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Record Markdown component', function() {
    var $compile, scope, $q, utilSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        injectTrustedFilter();
        mockUtil();

        this.markdown = '<h1>Test</h1>';
        module($provide => {
            $provide.constant('showdown', {
                Converter: jasmine.createSpy('Converter').and.returnValue({
                    setFlavor: jasmine.createSpy('setFlavor'),
                    makeHtml: jasmine.createSpy('makeHtml').and.returnValue(this.markdown)
                })
            });
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
        });

        this.recordId = 'recordId';
        this.abstract = '#Test';

        this.record = {'@id': this.recordId};
        utilSvc.getDctermsValue.and.callFake((obj, propId) => propId === 'abstract' ? this.abstract : '');
        scope.record = this.record;
        scope.canEdit = false;
        scope.updateRecord = jasmine.createSpy('updateRecord').and.returnValue($q.when());
        this.element = $compile(angular.element('<record-markdown record="record" update-record="updateRecord(record)" can-edit="canEdit"></record-markdown>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordMarkdown');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('initializes correctly', function() {
        it('with the record markdown', function() {
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(scope.record, 'abstract');
            expect(this.controller.converter.makeHtml).toHaveBeenCalledWith(this.abstract);
            expect(this.controller.markdownHTML).toEqual(this.markdown);
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).toEqual(this.record);
        });
        it('canEdit is one way bound', function() {
            this.controller.canEdit = true;
            scope.$digest();
            expect(scope.canEdit).toEqual(false);
        });
        it('updateRecord is called in the parent scope', function() {
            this.controller.updateRecord({record: {}});
            expect(scope.updateRecord).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        describe('should show the markdown editor', function() {
            it('if the record can be edited', function() {
                this.controller.canEdit = true;
                this.controller.showEdit();
                expect(this.controller.edit).toEqual(true);
                expect(this.controller.editMarkdown).toEqual(this.abstract);
            });
            it('unless the record cannot be edited', function() {
                this.controller.showEdit();
                expect(this.controller.edit).toEqual(false);
                expect(this.controller.editMarkdown).toEqual('');
            });
        });
        describe('should save the markdown edit', function() {
            beforeEach(function() {
                this.editedMarkdown = 'Test';
                this.controller.edit = true;
            });
            describe('if the edited value is different than the original value', function() {
                beforeEach(function() {
                    this.controller.editMarkdown = this.editedMarkdown;
                });
                it('if updateRecord resolves', function() {
                    this.controller.saveEdit();
                    scope.$apply();
                    expect(scope.updateRecord).toHaveBeenCalledWith(this.record);
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(this.record, 'abstract', this.editedMarkdown);
                    expect(this.controller.edit).toEqual(false);
                    expect(this.controller.editMarkdown).toEqual('');
                });
                it('unless updateRecord rejects', function() {
                    scope.updateRecord.and.returnValue($q.reject());
                    this.controller.saveEdit();
                    scope.$apply();
                    expect(scope.updateRecord).toHaveBeenCalledWith(this.record);
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(this.record, 'abstract', this.editedMarkdown);
                    expect(this.controller.edit).toEqual(true);
                    expect(this.controller.editMarkdown).toEqual(this.editedMarkdown);
                    expect(utilSvc.updateDctermsValue).toHaveBeenCalledWith(this.record, 'abstract', this.abstract);
                });
            });
            it('unless the edited value is the same as the original value', function() {
                this.controller.editMarkdown = this.abstract;
                this.controller.saveEdit();
                scope.$apply();
                expect(scope.updateRecord).not.toHaveBeenCalled();
                expect(utilSvc.updateDctermsValue).not.toHaveBeenCalled();
                expect(this.controller.edit).toEqual(false);
                expect(this.controller.editMarkdown).toEqual('');
            });
        });
        it('should cancel the markdown edit', function() {
            this.controller.cancelEdit();
            expect(this.controller.edit).toEqual(false);
            expect(this.controller.editMarkdown).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-MARKDOWN');
        });
        it('depending on whether the user can edit the record', function() {
            var div = angular.element(this.element.querySelectorAll('.view-record-markdown')[0]);
            expect(div.hasClass('hover')).toEqual(false);

            this.controller.canEdit = true;
            scope.$digest();
            expect(div.hasClass('hover')).toEqual(true);
        });
        it('depending on whether the markdown is being edited', function() {
            expect(this.element.querySelectorAll('.view-record-markdown').length).toEqual(1);
            expect(this.element.find('markdown-editor').length).toEqual(0);

            this.controller.edit = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.view-record-markdown').length).toEqual(0);
            expect(this.element.find('markdown-editor').length).toEqual(1);
        });
        it('depending on whether there is any markdown', function() {
            expect(this.element.querySelectorAll('.view-record-markdown .markdown').length).toEqual(1);
            expect(this.element.querySelectorAll('.view-record-markdown .text-muted').length).toEqual(0);
            
            this.controller.markdownHTML = '';
            scope.$digest();
            expect(this.element.querySelectorAll('.view-record-markdown .markdown').length).toEqual(0);
            expect(this.element.querySelectorAll('.view-record-markdown .text-muted').length).toEqual(1);
        });
    });
    it('should call showEdit when the markdown display is clicked', function() {
        spyOn(this.controller, 'showEdit');
        var div = angular.element(this.element.querySelectorAll('.view-record-markdown')[0]);
        div.triggerHandler('click');
        expect(this.controller.showEdit).toHaveBeenCalled();
    });
});