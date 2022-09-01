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
/**
 * @interface shared.OnEditEventI
 *
 * A interface that creates content for a modal that edits an IRI. 
 *
 * @param {Object} value Information provided to the modal
 * @param {string} value.iriBegin A string containing the beginning/namespace of the IRI
 * @param {string} value.iriThen A string containing the separator of the IRI
 * @param {string} value.iriEnd A string containing the end/local name of the IRI
 */

export interface OnEditEventI {
    value: {
        iriBegin: string;
        iriThen: string;
        iriEnd: string;
    };
}
