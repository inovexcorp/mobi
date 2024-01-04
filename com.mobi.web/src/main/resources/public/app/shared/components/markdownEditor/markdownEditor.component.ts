/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatMarkdownEditorOptions } from 'mat-markdown-editor/dist';

/**
 * @class shared.MarkdownEditorComponent
 *
 * A component which creates a `mat-markdown-editor` for the provided markdown value and buttons to save or optionally
 * cancel the editor. The editor also provided a help button to open the GitHub markdown information page.
 *
 * @param {string} markdown The variable containing the markdown value
 * @param {number} height An optional pixel height for the editor
 * @param {boolean} cancellable Whether the input should be able to be cancelled
 * @param {boolean} allowBlank Whether the input should allow a blank value to be saved
 * @param {Function} markdownChangeEvent A function to be called when the value of the markdown editor changes
 * @param {Function} saveEvent A function to call when the save button is clicked
 * @param {Function} cancelEvent A function to call when the "cancel" button is clicked
 */
@Component({
    selector: 'markdown-editor',
    templateUrl: './markdownEditor.component.html',
    styleUrls: ['./markdownEditor.component.scss']
})
export class MarkdownEditorComponent implements OnInit {
    markdownOptions: MatMarkdownEditorOptions = {
        resizable: false,
        mode: 'editor',
        showBorder: true,
        toolbarColor: 'primary',
        hideIcons: {
            Image: true,
            Fullscreen: true,
            Reference: true
        },
        height: '500px'
    };

    @Input() allowBlank: boolean;
    @Input() cancellable: boolean;
    @Input() markdown: string;
    @Input() height: number;

    @Output() markdownChange = new EventEmitter<string>();
    @Output() saveEvent = new EventEmitter<null>();
    @Output() cancelEvent = new EventEmitter<null>();
    
    constructor() {}

    ngOnInit(): void {
        if (this.height) {
            this.markdownOptions.height = `${this.height}px`;
        }
    }
    openHelp(): void {
        window.open('https://guides.github.com/features/mastering-markdown/', '_blank');
    }
    cancel(): void {
        this.cancelEvent.emit();
    }
    save(): void {
        this.markdownChange.emit(this.markdown);
        this.saveEvent.emit();
    }
}
