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
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import EventSource from 'eventsourcemock';

import { REST_PREFIX } from '../../constants';
import { SSEEvent } from '../models/sse-event';
import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SseService
      ]
    });
    service = TestBed.inject(SseService);
    window['EventSource'] = EventSource;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should initialize the EventSource', () => {
    service.initializeEvents();
    expect((service as any)['_eventSource'].url).toEqual(`${REST_PREFIX}sse-stream`);
  });
  it('should stop the EventSource', () => {
    service.initializeEvents();
    const eventSourceMock: EventSource = (service as any)['_eventSource'];
    expect(eventSourceMock).toBeTruthy();

    spyOn(eventSourceMock, 'close');
    service.stopEvents();
    expect(eventSourceMock.close).toHaveBeenCalledWith();
    expect((service as any)['_eventSource']).toBeNull();
  });
  describe('should get an Observable on the EventSource', () => {
    beforeEach(() => {
      service.initializeEvents();
    });
    it('that correctly handles new data', fakeAsync(() => {
      const eventSourceMock: EventSource = (service as any)['_eventSource'];
      expect(eventSourceMock).toBeTruthy();
      const sseEvent: SSEEvent = {
        type: 'type',
        data: []
      };

      service.getEvents().subscribe({
        next: result => {
          expect(result).toEqual(sseEvent);
        }
      });
      const event = new MessageEvent('message', {
        data: JSON.stringify(sseEvent)
      });
      eventSourceMock.emitMessage(event);
      tick();
    }));
    it('that correctly handles errors', fakeAsync(() => {
      const eventSourceMock: EventSource = (service as any)['_eventSource'];
      expect(eventSourceMock).toBeTruthy();
      const errorObj = new Error('Error message');

      service.getEvents().subscribe({
        error: response => {
          expect(response).toEqual(errorObj);
        }
      });
      eventSourceMock.emitError(errorObj);
      tick();
    }));
  });
});
