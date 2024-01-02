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
import { Directive, Input, Output, EventEmitter, HostListener, HostBinding } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Directive({ selector: '[copy-clipboard]' })
export class CopyClipboardDirective {

    @HostBinding('class.copyClipboard')
    class_copyClipboard = true;

    @Input('copy-clipboard')
    public payload: string;

    @Output('copied')
    public copied: EventEmitter<string> = new EventEmitter<string>();

    constructor(private toastr: ToastrService) {
    }

    @HostListener('click', ['$event'])
    public onClick(event: MouseEvent): void {

        event.preventDefault();
        event.stopPropagation();
        if (!this.payload) {
            return;
        }

        const listener = (e: ClipboardEvent) => {
            const clipboard = e.clipboardData || window['clipboardData'];
            clipboard.setData('text', this.payload.toString());
            e.preventDefault();

            this.copied.emit(this.payload);
            this.toastr.success('', 'Copied', {timeOut: 2000});
        };

        document.addEventListener('copy', listener, false);
        document.execCommand('copy');
        document.removeEventListener('copy', listener, false);
    }
}
