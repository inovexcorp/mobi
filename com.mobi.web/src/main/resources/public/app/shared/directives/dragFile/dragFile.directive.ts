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
import { Directive, ElementRef, EventEmitter, HostListener, OnInit, Output, Renderer2 } from '@angular/core';

import './dragFile.directive.scss';

/**
 * @class shared.DragFileDirective
 *
 * Attaches handlers for dragging and dropping a file(s) into the host element
 *
 * @param {Function} fileDropped the function to execute on file drop. Receives the list of files dropped
 */
 @Directive({
     selector: '[dragFile]'
})
export class DragFileDirective implements OnInit {
    @Output() fileDropped = new EventEmitter<any>();

    hoverArea: any;

    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngOnInit(): void {
        this.renderer.addClass(this.el.nativeElement, 'drag-file-container');

        // <span class="fa fa-cloud-upload"></span>
        const uploadIcon = this.renderer.createElement('span');
        this.renderer.addClass(uploadIcon, 'fa');
        this.renderer.addClass(uploadIcon, 'fa-cloud-upload');

        // <div class="p-2 bg-primary">Drop files to upload</div>
        const text = this.renderer.createText('Drop files to upload');
        const textContainer = this.renderer.createElement('div');
        this.renderer.addClass(textContainer, 'p-2');
        this.renderer.addClass(textContainer, 'bg-primary');
        this.renderer.appendChild(textContainer, text);        

        // <div class="drag-file-info position-absolute text-center text-white"></div>
        const dragFileInfo = this.renderer.createElement('div');
        this.renderer.addClass(dragFileInfo, 'drag-file-info');
        this.renderer.addClass(dragFileInfo, 'position-absolute');
        this.renderer.addClass(dragFileInfo, 'text-center');
        this.renderer.addClass(dragFileInfo, 'text-white');
        this.renderer.appendChild(dragFileInfo, uploadIcon);
        this.renderer.appendChild(dragFileInfo, textContainer);
        
        // <div ng-show="showDragFileOverlay" class="drag-file position-absolute h-100 w-100"></div>
        this.hoverArea = this.renderer.createElement('div');
        this.renderer.addClass(this.hoverArea, 'drag-file');
        this.renderer.addClass(this.hoverArea, 'position-absolute');
        this.renderer.addClass(this.hoverArea, 'h-100');
        this.renderer.addClass(this.hoverArea, 'w-100');
        this.renderer.addClass(this.hoverArea, 'fade-out');
        this.renderer.appendChild(this.hoverArea, dragFileInfo);

        this.renderer.appendChild(this.el.nativeElement, this.hoverArea);
    }

    @HostListener('dragover', ['$event']) public onDragOver(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.renderer.removeClass(this.hoverArea, 'fade-out');
        this.renderer.addClass(this.hoverArea, 'fade-in');
    }

    @HostListener('dragleave', ['$event']) public onDragLeave(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.renderer.removeClass(this.hoverArea, 'fade-in');
        this.renderer.addClass(this.hoverArea, 'fade-out');
    }

    @HostListener('drop', ['$event']) public onDrop(event: any): void {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.fileDropped.emit(files);
        }
        this.renderer.removeClass(this.hoverArea, 'fade-in');
        this.renderer.addClass(this.hoverArea, 'fade-out');
    }
}
