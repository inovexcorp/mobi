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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

/**
 * @class AddPathNodeHoverButtonComponent
 * 
 * A component that creates a hoverable area that will display a plus button either on the bottom of an element or the
 * right side. Meant to be used with {@link PathNodeDisplayComponent} and
 * {@link PropertyShapePathComponent}.
 * 
 * @param {boolean} [onBottom=true] Whether to display the hover area on the bottom of the element.
 * @param {Function} onClick A function to be called when the button is clicked
 */
@Component({
  selector: 'app-add-path-node-hover-button',
  templateUrl: './add-path-node-hover-button.component.html',
  styleUrls: ['./add-path-node-hover-button.component.scss']
})
export class AddPathNodeHoverButtonComponent implements OnInit {
  @Input() onBottom = true;
  
  @Output() onClick = new EventEmitter<void>()
  
  isPlusVisible = false;
  title = '';

  ngOnInit(): void {
    this.title = this.onBottom ? 'Add to Sequence' : 'Add to Alternative';
  }
}
