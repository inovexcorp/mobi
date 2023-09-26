/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
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

export type EventPayload = {[key: string]: any};
export class EventTypeConstants {
    // Event on branch removal (IRI of the record and the branch IRI)
    static EVENT_BRANCH_REMOVAL = 'EVENT_BRANCH_REMOVAL';
    // Event on merge request acceptance (IRI of the record being accepted and the target branch IRI)
    static EVENT_MERGE_REQUEST_ACCEPTED = 'EVENT_MERGE_REQUEST_ACCEPTED';
}

export interface EventWithPayload {
    eventType: string;
    payload: EventPayload;
}
