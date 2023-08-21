/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { AfterViewInit, Component, ElementRef, ViewChild, Input, SimpleChanges, OnChanges, ChangeDetectorRef} from '@angular/core';
import * as YATE from 'perfectkb-yate';

/**
 * @class shapes-graph-editor.YateComponent
 * 
 * A component that displays content using the YATE text editor.
 */
@Component({
    selector: 'yate',
    templateUrl: './yate.component.html',
    styleUrls: ['./yate.component.scss']
})
export class YateComponent implements OnChanges, AfterViewInit {
   
    @Input() content;
    @ViewChild('shapesGraphContent', { static: true }) shapesGraphContent : ElementRef;
    yate;
    
    constructor(private cdRef : ChangeDetectorRef) {}
    
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
}
