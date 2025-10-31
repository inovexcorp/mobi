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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { Repository } from '../../../shared/models/repository.interface';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RepositoriesPageComponent } from './repositories-page.component';

describe('RepositoriesPageComponent', () => {
  let component: RepositoriesPageComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<RepositoriesPageComponent>;
  let repositoryManagerStub: jasmine.SpyObj<RepositoryManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const native1: Repository = {
    id: 'native1',
    title: 'Native 1',
    type: 'native',
    limit: 1000,
    tripleCount: 500
  };
  const native2: Repository = {
    id: 'native2',
    title: 'Native 2',
    type: 'native',
    limit: 1000,
    tripleCount: 750
  };
  const native3: Repository = {
    id: 'native3',
    title: 'Native 3',
    type: 'native',
    limit: 1000,
    tripleCount: 900
  };
  const native4: Repository = {
    id: 'native4',
    title: 'Native 4',
    type: 'native',
    limit: 1000,
    tripleCount: 1100
  };
  const memory1: Repository = {
    id: 'memory1',
    title: 'Memory 1',
    type: 'memory',
  };
  const http1: Repository = {
    id: 'http1',
    title: 'HTTP 1',
    type: 'http',
  };
  const sparql1: Repository = {
    id: 'sparql1',
    title: 'SPARQL 1',
    type: 'sparql',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatChipsModule,
        MatProgressBarModule
      ],
      declarations: [RepositoriesPageComponent],
      providers: [
        MockProvider(RepositoryManagerService),
        MockProvider(ToastService)
      ]
    }).compileComponents();

    repositoryManagerStub = TestBed.inject(RepositoryManagerService) as jasmine.SpyObj<RepositoryManagerService>;
    repositoryManagerStub.getRepositories.and.returnValue(of([native1, native2, native3, native4, memory1, http1, sparql1]));
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    fixture = TestBed.createComponent(RepositoriesPageComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    repositoryManagerStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initializes correctly', () => {
    it('if repositories could be retrieved', () => {
      expect(component.repositories.length).toBe(7);
      expect(component.repositories).toContain(jasmine.objectContaining(native1));
      expect(component.repositories).toContain(jasmine.objectContaining(native2));
      expect(component.repositories).toContain(jasmine.objectContaining(native3));
      expect(component.repositories).toContain(jasmine.objectContaining(native4));
      expect(component.repositories).toContain(jasmine.objectContaining(memory1));
      expect(component.repositories).toContain(jasmine.objectContaining(http1));
      expect(component.repositories).toContain(jasmine.objectContaining(sparql1));
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
    });
    it('if repositories could not be retrieved', fakeAsync(() => {
      repositoryManagerStub.getRepositories.and.returnValue(throwError('Error'));
      component.repositories = [];
      component.ngOnInit();
      tick();
      expect(component.repositories.length).toBe(0);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Error'));
    }));
  });
  describe('controller method', () => {
    it('getCapacityPercentage correctly returns the percentage', () => {
      expect(Math.trunc(component.getCapacityPercentage(native1))).toBe(50);
      expect(Math.trunc(component.getCapacityPercentage(native2))).toBe(75);
      expect(Math.trunc(component.getCapacityPercentage(native3))).toBe(90);
      expect(Math.trunc(component.getCapacityPercentage(native4))).toBe(110);
      expect(Math.trunc(component.getCapacityPercentage(memory1))).toBe(0);
      expect(Math.trunc(component.getCapacityPercentage(http1))).toBe(0);
      expect(Math.trunc(component.getCapacityPercentage(sparql1))).toBe(0);
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.repositories-page')).length).toEqual(1);
      expect(element.queryAll(By.css('.repo-grid')).length).toEqual(1);
    });
    it('depending on how many repositories there are', () => {
      expect(element.queryAll(By.css('mat-card')).length).toEqual(7);
      
      component.repositories = [];
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-card')).length).toEqual(0);
    });
    it('for native repositories', () => {
      const nativeCards = element.queryAll(By.css('.repo-card.type-native'));
      expect(nativeCards.length).toBe(4);
      nativeCards.forEach((card, index) => {
        const repo = component.repositories.filter(r => r.type === 'native')[index];

        expect(card.classes['type-native']).toBeTrue();

        const idElem = card.query(By.css('.repo-id'));
        expect(idElem.nativeElement.textContent.trim()).toBe(repo.id);

        const titleElem = card.query(By.css('mat-card-subtitle'));
        expect(titleElem.nativeElement.textContent.trim()).toBe(repo.title);

        const chipElem = card.query(By.css('.type-chip'));
        expect(chipElem.nativeElement.textContent.trim()).toBe('NATIVE');

        const progressBarElem = card.query(By.css('mat-progress-bar'));
        expect(progressBarElem).toBeTruthy();
        const calculatedPercentage = component.getCapacityPercentage(repo);
        const expectedPercentage = calculatedPercentage > 100 ? 100 : calculatedPercentage;
        expect(progressBarElem.componentInstance.value).toBe(expectedPercentage);
      });
    });
    it('for memory repositories', () => {
      const memoryCards = element.queryAll(By.css('.repo-card.type-memory'));
      expect(memoryCards.length).toBe(1);
      memoryCards.forEach((card, index) => {
        const repo = component.repositories.filter(r => r.type === 'memory')[index];

        expect(card.classes['type-memory']).toBeTrue();

        const idElem = card.query(By.css('.repo-id'));
        expect(idElem.nativeElement.textContent.trim()).toBe(repo.id);

        const titleElem = card.query(By.css('mat-card-subtitle'));
        expect(titleElem.nativeElement.textContent.trim()).toBe(repo.title);

        const chipElem = card.query(By.css('.type-chip'));
        expect(chipElem.nativeElement.textContent.trim()).toBe('MEMORY');

        const progressBarElem = card.query(By.css('mat-progress-bar'));
        expect(progressBarElem).toBeFalsy();
      });
    });
    it('for SPARQL repositories', () => {
      const sparqlCards = element.queryAll(By.css('.repo-card.type-sparql'));
      expect(sparqlCards.length).toBe(1);
      sparqlCards.forEach((card, index) => {
        const repo = component.repositories.filter(r => r.type === 'sparql')[index];

        expect(card.classes['type-sparql']).toBeTrue();

        const idElem = card.query(By.css('.repo-id'));
        expect(idElem.nativeElement.textContent.trim()).toBe(repo.id);

        const titleElem = card.query(By.css('mat-card-subtitle'));
        expect(titleElem.nativeElement.textContent.trim()).toBe(repo.title);

        const chipElem = card.query(By.css('.type-chip'));
        expect(chipElem.nativeElement.textContent.trim()).toBe('SPARQL');

        const progressBarElem = card.query(By.css('mat-progress-bar'));
        expect(progressBarElem).toBeFalsy();
      });
    });
    it('for HTTP repositories', () => {
      const httpCards = element.queryAll(By.css('.repo-card.type-http'));
      expect(httpCards.length).toBe(1);
      httpCards.forEach((card, index) => {
        const repo = component.repositories.filter(r => r.type === 'http')[index];

        expect(card.classes['type-http']).toBeTrue();

        const idElem = card.query(By.css('.repo-id'));
        expect(idElem.nativeElement.textContent.trim()).toBe(repo.id);

        const titleElem = card.query(By.css('mat-card-subtitle'));
        expect(titleElem.nativeElement.textContent.trim()).toBe(repo.title);

        const chipElem = card.query(By.css('.type-chip'));
        expect(chipElem.nativeElement.textContent.trim()).toBe('HTTP');

        const progressBarElem = card.query(By.css('mat-progress-bar'));
        expect(progressBarElem).toBeFalsy();
      });
    });
  });
});
