/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlightText',
})
export class HighlightTextPipe implements PipeTransform {
  transform(value: any, args: any, background = false): any {
    if (!args) {
      return value;
    }

    const regex = new RegExp(args.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    const match = value.match(regex);

    if (!match) {
      return value;
    }

    if (background) {
      return value.replace(regex, '<span class="highlight-text"><mark>' + match[0] + '</mark></span>');
    }
    return value.replace(regex, '<span class="highlight-text">' + match[0] + '</span>');
  }
}
