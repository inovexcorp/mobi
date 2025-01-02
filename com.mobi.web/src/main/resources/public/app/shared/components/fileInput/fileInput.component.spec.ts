/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement, SimpleChange, SimpleChanges } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FileInputComponent } from './fileInput.component';

describe('File Input component', function() {
  let component: FileInputComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<FileInputComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [
        FileInputComponent,
      ],
      providers: []
    }).compileComponents();
    fixture = TestBed.createComponent(FileInputComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.accept = [];
    component.displayText = '';
    component.isRequired = true;
    component.isMultiple = true;
    component.multiple = 'multiple';
    component.required = 'required';
    component.files = [];
  });
  describe('should initialize with the correct value for', function() {
    it('files', function() {
      expect(component.files).toEqual([]);
    });
    it('accept', function() {
      expect(component.accept).toEqual([]);
    });
    it('displayText', function() {
      expect(component.displayText).toEqual('');
    });
    it('multiple', function() {
      expect(component.multiple).toEqual('multiple');
    });
    it('required', function() {
      expect(component.required).toEqual('required');
    });
  });
  describe('ngOnChanges', function() {
    it('should update isRequired when the @input required is a boolean true', () => {
      //  <file-input [required]='true'></file-input>
      component.isRequired = false;
      const changes: SimpleChanges = {
        required: new SimpleChange(undefined, true, true)
      };
      component.ngOnChanges(changes);
      expect(component.isRequired).toBe(true);
      });
    it('should update isRequired when the @input required is a boolean false', () => {
      //  <file-input [required]='false'></file-input>
      component.isRequired = true;
      const changes: SimpleChanges = {
        required: new SimpleChange(undefined, false, true)
      };
      component.ngOnChanges(changes);
      expect(component.isRequired).toBe(false);
    });
    it('should update isRequired when the @input required is a string', () => {
      // <file-input required></file-input>
      component.isRequired = false;
      const changes: SimpleChanges = {
        required: new SimpleChange(undefined, '', true)
      };
      component.ngOnChanges(changes);
      expect(component.isRequired).toBe(true);
    });
    it('should update isRequired if @input required input is undefined', () => {
      //  <file-input [required]=undefined></file-input>
      component.isRequired = true;
      const changes: SimpleChanges = {
        isRequired: new SimpleChange(false, undefined, true)
      };
      component.ngOnChanges(changes);
      expect(component.isRequired).toBe(false);
    });
    it('should update isMultiple when the @input multiple is a boolean true', () => {
      // <file-input [multiple]='true'></file-input>
      component.isMultiple = false;
      const changes: SimpleChanges = {
        multiple: new SimpleChange(false, true, true)
      };
      component.ngOnChanges(changes);
      expect(component.isMultiple).toBe(true);
    });
    it('should update isMultiple when the @input multiple is a boolean flase', () => {
      // <file-input [multiple]='false'></file-input>
      component.isMultiple = true;
      const changes: SimpleChanges = {
        multiple: new SimpleChange(true, false, true)
      };
      component.ngOnChanges(changes);
      expect(component.isMultiple).toBe(false);
    });
    it('should update isRequired when the @input multiple is a string', () => {
      // <file-input multiple></file-input>
      component.isMultiple = false;
      const changes: SimpleChanges = {
        multiple: new SimpleChange(undefined, '', true)
      };
      component.ngOnChanges(changes);
      expect(component.isMultiple).toBe(true);
    });
    it('should update isMultiple when @input multiple is undefined', () => {
      // <file-input [multiple]='undefined'></file-input>
      component.isMultiple = false;
      const changes: SimpleChanges = {
        multiple: new SimpleChange(false, undefined, true)
      };
      component.ngOnChanges(changes);
      expect(component.isMultiple).toBe(false);
    });
    it('should set defaults for isMultiple and isRequired', () => {
      // <file-input></file-input>
      component.isMultiple = true;
      component.isRequired = true;
      const changes: SimpleChanges = {};
      component.ngOnChanges(changes);
      expect(component.isMultiple).toBe(false);
      expect(component.isRequired).toBe(false);
    });
    it('should call _handleFilesField when the files input changes', () => {
      const mockFiles = [new File([], 'test.txt')];
      spyOn(component as any, '_handleFilesField');
      
      const changes: SimpleChanges = {
        files: new SimpleChange([], mockFiles, true)
      };
      component.ngOnChanges(changes);
      expect(component['_handleFilesField']).toHaveBeenCalledWith(mockFiles);
      });
  });
  describe('handles file selection updates', function() {
    // Simulate input change event
    it('should reset text and emit empty files array when no files are selected and isMultiple is true', () => {
      component.isMultiple = true;
      component.multiple = 'multiple';
      spyOn(component.filesChange, 'emit');
      
      const event = { target: { files: [] } } as unknown as Event;
      component.update(event);
      
      expect(component.selected).toBe(false);
      expect(component.text).toBe('No files selected');
      expect(component.filesChange.emit).toHaveBeenCalledWith([]);
    });
    it('should reset text and emit empty files array when no files are selected and isMultiple is false', () => {
      spyOn(component.filesChange, 'emit');
      component.isMultiple = false;
      component.multiple = undefined;
      
      const event = { target: { files: [] } } as unknown as Event;
      component.update(event);
      expect(component.selected).toBe(false);
      expect(component.text).toBe('No file selected');
      expect(component.filesChange.emit).toHaveBeenCalledWith(undefined);
    });
    it('should handle multiple file selection correctly', () => {
      spyOn(component.filesChange, 'emit');
      component.multiple = '';
      component.isMultiple = true;
      component.required = '';
      component.isRequired = true;

      const file1 = new File([''], 'file1.txt');
      const file2 = new File([''], 'file2.txt');
      const event = { target: { files: [file1, file2] } } as unknown as Event;

      component.update(event);
      expect(component.selected).toBe(true);
      expect(component.text).toBe('file1.txt, file2.txt');
      expect(component.filesChange.emit).toHaveBeenCalledWith([file1, file2]);
    });
    it('should handle single file selection correctly', () => {
      spyOn(component.filesChange, 'emit');
      spyOn(component as any, '_fileUpdateEvent').and.callThrough();

      component.multiple = undefined;
      component.isMultiple = false;
      component.required = '';
      component.isRequired = true;

      const file = new File([''], 'singleFile.txt');
      const event = { target: { files: [file] } } as unknown as Event;

      component.update(event);

      expect(component['_fileUpdateEvent']).toHaveBeenCalledWith([file]);

      expect(component.selected).toBe(true);
      expect(component.text).toBe('singleFile.txt');
      expect(component.filesChange.emit).toHaveBeenCalledWith(file);
    });
  });
  it('should reset the text correctly in resetText method', () => {
    component.text = '';
    component.isMultiple = true;
    component['_resetText']();

    expect(component.text).toBe('No files selected');

    component.isMultiple = false;
    component['_resetText']();

    expect(component.text).toBe('No file selected');
  });
  it('should collect file names correctly in _collectFileNames method', () => {
    const files = [
      new File([''], 'file1.txt'),
      new File([''], 'file2.txt'),
      new File([''], 'file3.txt')
    ];
    const result = component['_collectFileNames'](files);
    expect(result).toBe('file1.txt, file2.txt, file3.txt');
  });
  describe('contains the correct html', function() {
    it('for wrapping contains', function() {
      expect(element.queryAll(By.css('.file-input')).length).toEqual(1);
      expect(element.queryAll(By.css('input[type="file"]')).length).toEqual(1);
    });
    it('if displayText was provided', function() {
      expect(element.queryAll(By.css('.field-label')).length).toEqual(0);
      component.displayText = 'Test';
      fixture.detectChanges();
      expect(element.queryAll(By.css('.field-label')).length).toEqual(1);
    });
    it('depending on whether the input should accept multiple', function() {
      let input = element.query(By.css('input'));
      expect(input.nativeElement.getAttribute('multiple')).toBeNull();
      component.isMultiple = true;
      fixture.detectChanges();
      expect(input.nativeElement.getAttribute('multiple')).toEqual('');
      input = element.query(By.css('input'));
    });
    it('depending on whether the input should be required', function() {
      let input = element.query(By.css('input'));
      expect(input.nativeElement.getAttribute('required')).toBeNull();
      component.isRequired = true;
      fixture.detectChanges();
      input = element.query(By.css('input'));
      expect(input.nativeElement.getAttribute('required')).toEqual('');
    });
    it('should render the button with the correct text', () => {
      fixture.detectChanges();
    
      const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    
      expect(buttonElement).toBeTruthy();
      expect(buttonElement.textContent.trim()).toBe('Choose File');
      });
    it('should display the displayText when it is set', () => {
      component.displayText = 'Test Label';
      fixture.detectChanges();
    
      const labelElement = fixture.debugElement.query(By.css('.field-label'));
      expect(labelElement).toBeTruthy();
      expect(labelElement.nativeElement.textContent).toContain('Test Label');
    });
    it('should hide the displayText when it is not set', () => {
      component.displayText = '';
      fixture.detectChanges();
    
      const labelElement = fixture.debugElement.query(By.css('.field-label'));
      expect(labelElement).toBeFalsy();
    });
    it('should bind accept, required, and multiple attributes to the input element', fakeAsync(() => {
      component.accept = ['.png','.jpg'];
      component.isRequired = true;
      component.isMultiple = true;

      fixture.detectChanges();
      tick(); // Simulate the passage of time for async operations
      fixture.detectChanges();
    
      const inputElement = fixture.debugElement.query(By.css('input[type="file"]'));

      expect(inputElement.attributes['accept']).toBe('.png,.jpg');
      // Angular Testing not setting these attributes
      // expect(inputElement.attributes['required']).toBe('true'); 
      // expect(inputElement.attributes['multiple']).toBe('multiple');
    }));
    it('should apply text-body class based on selected property', () => {
      component.selected = true;
      fixture.detectChanges();
    
      let spanElement = fixture.debugElement.query(By.css('.file-name-label'));
      expect(spanElement.classes['text-body']).toBeTrue();
    
      component.selected = false;
      fixture.detectChanges();
    
      spanElement = fixture.debugElement.query(By.css('.file-name-label'));
      expect(spanElement.classes['text-body']).toEqual(undefined);
      });
      it('should display the correct text in the file name label', () => {
      component.text = 'example.txt';
      fixture.detectChanges();
    
      const spanElement = fixture.debugElement.query(By.css('.file-name-label'));
      expect(spanElement.nativeElement.textContent.trim()).toBe('example.txt');
    });
  });
  describe('handles html events and', function() {
    it('should call update method when file input changes', () => {
      spyOn(component, 'update');
    
      const inputElement = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    
      const event = new Event('change');
      inputElement.dispatchEvent(event);
    
      expect(component.update).toHaveBeenCalledWith(event);
    });
    it('should click the hidden file input when the button is clicked', () => {
      spyOn(fixture.debugElement.query(By.css('input[type="file"]')).nativeElement, 'click');
    
      const buttonElement = fixture.debugElement.query(By.css('button'));
      buttonElement.triggerEventHandler('click', null);
    
      expect(fixture.debugElement.query(By.css('input[type="file"]')).nativeElement.click).toHaveBeenCalled();
    });
  });
});
