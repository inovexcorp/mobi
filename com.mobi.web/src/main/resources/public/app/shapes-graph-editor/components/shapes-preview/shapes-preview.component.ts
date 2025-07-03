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
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import * as YATE from 'perfectkb-yate';

/**
 * @class shapes-graph-editor.ShapesPreviewComponent
 * 
 * A component that displays content using the YATE text editor.
 * 
 * @param {string} content - The textual content to display in the editor.
 * @param {string} format - The format of the content (e.g., "text/turtle", "application/ld+json").
 * @param {EventEmitter<string>} contentTypeChange - Event emitted when the content type is changed.
 */
@Component({
  selector: 'shapes-preview',
  templateUrl: './shapes-preview.component.html',
  styleUrls: ['./shapes-preview.component.scss']
})
export class ShapesPreviewComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() content: string;
  @Input() format: string;
  @Output() contentTypeChange = new EventEmitter<string>();

  @ViewChild('shapesGraphContent', { static: true }) shapesGraphContent : ElementRef;

  yate: any;
  serializationForm: UntypedFormGroup = this.fb.group({ serialization: [''] });
    
  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.serializationForm.patchValue({serialization: this.format});
  }

  ngOnChanges(changesObj: SimpleChanges): void {
    if (!changesObj.content || !changesObj.content.isFirstChange()) {
      this.yate.setValue(this.content);
    }
  }

  ngAfterViewInit(): void{
    this.initUI(this.content);
  }

  initUI(content: string): void {
    delete YATE.Autocompleters.prefixes;
    this.yate = (<any>YATE).default(this.shapesGraphContent.nativeElement,
      {
        tabMode: 'indent',
        lineNumbers: true,
        lineWrapping: true,
        backdrop: false,
        foldGutter: {
          rangeFinder: new YATE.fold.combine(YATE.fold.brace, YATE.fold.prefix)
        },
        collapsePrefixesOnLoad: false,
        gutters: ['gutterErrorBar', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        matchBrackets: true,
        readOnly: true,
        fixedGutter: true,
        syntaxErrorCheck: true,
        value: content,
        options: {
            autocompleters: []
        }
      });
    this.yate.setSize('100%', '100%');
    this.yate.setValue(content);
  }

  setContent(): void {
    this.contentTypeChange.emit(this.serializationForm.value.serialization);
  }
}