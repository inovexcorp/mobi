/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ONTOLOGYEDITOR, SETTING, SH, SHAPESGRAPHEDITOR } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../models/RESTError.interface';
import { SettingConstants } from '../models/settingConstants.class';
import { ToastService } from './toast.service';
import { SettingManagerService } from './settingManager.service';

describe('Setting Manager service', function() {
  let service: SettingManagerService;
  let httpMock: HttpTestingController;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let annotationDefinition: any;
  const error = 'error message';
  const errorObj: RESTError = { error: '', errorMessage: error, errorDetails: [] };
  const prefType = 'https://mobi.com/ontologies/setting#TestPreferenceType';
  const prefGroup = 'https://mobi.com/ontologies/setting#TestPreferenceGroup';
  const appSettingType = 'https://mobi.com/ontologies/setting#TestApplicationSettingType';
  const appSettingGroup = 'https://mobi.com/ontologies/setting#TestApplicationSettingGroup';
  const defaultNamespace = 'urn:default-namespace/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        SettingManagerService,
        MockProvider(ProgressSpinnerService),
        MockProvider(ToastService),
      ]
    });

    service = TestBed.inject(SettingManagerService);
    httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);

    annotationDefinition = [{
      '@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreference',
      'http://mobi.com/ontologies/setting#inGroup': [{'@id': 'https://mobi.solutions/ontologies/editor#EditorPreferencesGroup'}],
      'http://purl.org/dc/terms/description': [{'@value': 'Default Annotation Preference'}],
      'http://www.w3.org/ns/shacl#property': [{'@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreferencePropertyShape'}]
    },
      {
        '@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreferencePropertyShape',
        'http://www.w3.org/ns/shacl#defaultValue': [
          {
            '@language': 'en',
            '@value': 'RDFS'
          }
        ],
      }
    ];
  });

  afterEach(function() {
    service = null;
    httpMock = null;
    progressSpinnerStub = null;
    toastStub = null;
  });

  describe('should retrieve the default namespace', () => {
    const settingInstance: JSONLDObject = {
      '@id': 'urn:setting',
      '@type': [],
      [SettingConstants.HAS_DATA_VALUE]: [{ '@value': defaultNamespace }]
    };
    beforeEach(() => {
      spyOn(service, 'getDefaultNamespaceFromSetting').and.returnValue(throwError(''));
    });
    describe('for ontologies', () => {
      const type = `${ONTOLOGYEDITOR}OntologyRecord`;
      it('successfully', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([settingInstance]));
        service.getDefaultNamespace(type).subscribe(result => {
          expect(result).toEqual(defaultNamespace);
        }, () => fail('Observable should have resolved'));
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.getDefaultNamespaceFromSetting).not.toHaveBeenCalled();
      }));
      it('unless the setting does not have a data value', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([{'@id': ''}]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
      it('unless the return array is empty', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Issue retrieving value for default namespace. Please contact support.');
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
      it('unless more than one setting definition was returned', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([settingInstance, {'@id': '2'}]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Issue retrieving value for default namespace'));
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
    });
    describe('for shapes graphs', () => {
      const type = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;
      it('successfully', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([settingInstance]));
        service.getDefaultNamespace(type).subscribe(result => {
          expect(result).toEqual(defaultNamespace);
        }, () => fail('Observable should have resolved'));
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.getDefaultNamespaceFromSetting).not.toHaveBeenCalled();
      }));
      it('unless the setting does not have a data value', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([{'@id': ''}]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
      it('unless the return array is empty', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Issue retrieving value for default namespace. Please' +
          ' contact support.');
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
      it('unless more than one setting definition was returned', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(of([settingInstance, {'@id': '2'}]));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Issue retrieving value for default namespace'));
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
      it('unless an error occurs', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingByType').and.returnValue(throwError('Error'));
        service.getDefaultNamespace(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingByType).toHaveBeenCalledWith(service.defaultNamespaceMap[type].setting);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.getDefaultNamespaceFromSetting).toHaveBeenCalledWith(type);
      }));
    });
    it('unless the record type does not have a default namespace', fakeAsync(() => {
      spyOn(service, 'getApplicationSettingByType');
      service.getDefaultNamespace('error').subscribe(() => fail('Observable should have rejected'), result => {
        expect(result).toContain('No setting found');
      });
      tick();
      expect(service.getApplicationSettingByType).not.toHaveBeenCalled();
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      expect(service.getDefaultNamespaceFromSetting).not.toHaveBeenCalled();
    }));
  });
  describe('should retrieve the default namespace from the setting definition', () => {
    describe('for ontologies', () => {
      const type = `${ONTOLOGYEDITOR}OntologyRecord`;
      it('successfully', fakeAsync(() => {
        const propertyShape = {
          '@id': service.defaultNamespaceMap[type].propertyShape,
          [`${SH}defaultValue`]: [{ '@value': defaultNamespace }]
        };
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([propertyShape]));
        service.getDefaultNamespaceFromSetting(type).subscribe(result => {
          expect(result).toEqual(defaultNamespace);
        }, () => fail('Observable should have resolved'));
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless the setting does not have a default value', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([{'@id': service.defaultNamespaceMap[type].propertyShape}]));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('No default value'));
      }));
      it('unless the property shape could not be found', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([]));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Number of'));
      }));
      it('unless an error occurs', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(throwError('Error'));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Could not'));
      }));
    });
    describe('for shapes graphs', () => {
      const type = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;
      it('successfully', fakeAsync(() => {
        const propertyShape = {
          '@id': service.defaultNamespaceMap[type].propertyShape,
          [`${SH}defaultValue`]: [{ '@value': defaultNamespace }]
        };
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([propertyShape]));
        service.getDefaultNamespaceFromSetting(type).subscribe(result => {
          expect(result).toEqual(defaultNamespace);
        }, () => fail('Observable should have resolved'));
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless the setting does not have a default value', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([{'@id': service.defaultNamespaceMap[type].propertyShape}]));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('No default value'));
      }));
      it('unless the property shape could not be found', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(of([]));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Number of'));
      }));
      it('unless an error occurs', fakeAsync(() => {
        spyOn(service, 'getApplicationSettingDefinitions').and.returnValue(throwError('Error'));
        service.getDefaultNamespaceFromSetting(type).subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('');
        });
        tick();
        expect(service.getApplicationSettingDefinitions).toHaveBeenCalledWith(service.namespaceGroup);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Could not'));
      }));
    });
    it('unless the record type does not have a default namespace', fakeAsync(() => {
      spyOn(service, 'getApplicationSettingDefinitions');
      service.getDefaultNamespaceFromSetting('error').subscribe(() => fail('Observable should have rejected'), result => {
        expect(result).toContain('No setting found');
      });
      tick();
      expect(service.getApplicationSettingDefinitions).not.toHaveBeenCalled();
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
    }));
  });
  describe('should retrieve the default annotation preference', () => {
    const annotationIRI = 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreference';
    const prefGroupIRI = 'https://mobi.solutions/ontologies/editor#EditorPreferencesGroup';
    const errorMsg = 'Issue retrieving current value for Default Annotation preference. Utilizing default value.';
    let annotationPreference: any;

    beforeEach(() => {
      annotationPreference = {
        '@id': 'http://mobi.solutions/setting#test',
        'http://mobi.com/ontologies/setting#forUser': [{'@id': 'http://mobi.com/users/test'}],
        'http://mobi.com/ontologies/setting#hasDataValue': [{'@value': 'DC Terms'}]
      };
    });
    it('successfully', fakeAsync(() => {
      spyOn(service, 'getUserPreferenceByType').and.returnValue(of([annotationPreference]));
      spyOn(service, 'getPreferenceDefinitions').and.returnValue(of([]));
      service.getAnnotationPreference().subscribe(result => {
        expect(result).toEqual('DC Terms');
      }, () => fail('Observable should have resolved'));
      tick();
      expect(service.getUserPreferenceByType).toHaveBeenCalledWith(annotationIRI);
      expect(service.getPreferenceDefinitions).not.toHaveBeenCalled();
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
    }));
    it('unless more than one preference was returned', fakeAsync(() => {
      spyOn(service, 'getUserPreferenceByType').and.returnValue(of([annotationPreference, annotationPreference]));
      spyOn(service, 'getPreferenceDefinitions').and.returnValue(of(annotationDefinition));
      service.getAnnotationPreference().subscribe(result => {
        expect(result).toEqual('RDFS');
      });
      tick();
      expect(service.getUserPreferenceByType).toHaveBeenCalledWith(annotationIRI);
      expect(service.getPreferenceDefinitions).toHaveBeenCalledWith(prefGroupIRI);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(errorMsg);
    }));
    it('unless a preference was not returned', fakeAsync(() => {
      spyOn(service, 'getUserPreferenceByType').and.returnValue(of([]));
      spyOn(service, 'getPreferenceDefinitions').and.returnValue(of(annotationDefinition));
      service.getAnnotationPreference().subscribe(result => {
        expect(result).toEqual('RDFS');
      });
      tick();
      expect(service.getUserPreferenceByType).toHaveBeenCalledWith(annotationIRI);
      expect(service.getPreferenceDefinitions).toHaveBeenCalledWith(prefGroupIRI);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(errorMsg);
    }));
    describe('unless the preference does not have a data value', () => {
      beforeEach(() => {
        delete annotationPreference[`${SETTING}hasDataValue`];
      });
      it('and there is no default value in the preference definition', fakeAsync(() => {
        annotationDefinition = [
          {
            '@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreference',
            'http://mobi.com/ontologies/setting#inGroup': [{'@id': 'https://mobi.solutions/ontologies/editor#EditorPreferencesGroup'}],
            'http://purl.org/dc/terms/description': [{'@value': 'Default Annotation Preference'}],
            'http://www.w3.org/ns/shacl#property': [{'@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreferencePropertyShape'}]
          },
          { '@id': 'https://mobi.solutions/ontologies/editor#DefaultAnnotationPreferencePropertyShape' }
        ];
        spyOn(service, 'getUserPreferenceByType').and.returnValue(of([annotationPreference]));
        spyOn(service, 'getPreferenceDefinitions').and.returnValue(of(annotationDefinition));
        service.getAnnotationPreference().subscribe(() => fail('Observable should have rejected'), result => {
          expect(result).toEqual('No preference definition found');
        });
        tick();
        expect(service.getUserPreferenceByType).toHaveBeenCalledWith(annotationIRI);
        expect(service.getPreferenceDefinitions).toHaveBeenCalledWith(prefGroupIRI);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Issue retrieving definition for preference');
      }));
      it('and there is a default value in the preference definition', fakeAsync(() => {
        spyOn(service, 'getUserPreferenceByType').and.returnValue(of([annotationPreference]));
        spyOn(service, 'getPreferenceDefinitions').and.returnValue(of(annotationDefinition));
        service.getAnnotationPreference().subscribe(result => {
          expect(result).toEqual('RDFS');
        }, () => fail('Observable should have resolved'));
        tick();
        expect(service.getUserPreferenceByType).toHaveBeenCalledWith(annotationIRI);
        expect(service.getPreferenceDefinitions).toHaveBeenCalledWith(prefGroupIRI);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
    });
  });
  describe('should retrieve a list of user preferences', function() {
    beforeEach(function() {
      this.url = service.prefix;
    });
    it('unless an error occurs', function() {
      service.getUserPreferences()
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.getUserPreferences()
        .subscribe((response: { [key: string]: JSONLDObject[] }) => {
          expect(response).toEqual({'type': [{'@id': 'test'}]});
        }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush({'type': [{'@id': 'test'}]});
    });
  });
  describe('should get a preference by type', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/types/${encodeURIComponent(prefType)}`;
    });
    it('unless an error occurs', function() {
      service.getUserPreferenceByType(prefType)
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });

    });
    it('successfully', function() {
      service.getUserPreferenceByType(prefType)
        .subscribe((response: JSONLDObject[]) => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush([{'@id': 'test'}]);
    });
  });
  describe('should update a preference', function() {
    beforeEach(function() {
      this.newRecord = {};
      this.url = `${service.prefix}/1234`;
    });
    it('unless an error occurs', function() {
      service.updateUserPreference('1234', prefType, this.newRecord)
        .subscribe(() => fail('Observable should have rejected'),
          response => expect(response).toEqual(errorObj));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.updateUserPreference('1234', prefType, this.newRecord)
        .subscribe(() => expect(true).toBeTrue(),
          () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
      expect(request.request.params.get('subType')).toEqual(prefType);
      expect(request.request.params.get('type')).toEqual(`${SETTING}Preference`);
      request.flush(200);
    });
  });
  describe('should create a preference', function() {
    beforeEach(function() {
      this.newRecord = {};
      this.url = service.prefix;
    });
    it('unless an error occurs', function() {
      service.createUserPreference(prefType, this.newRecord)
        .subscribe(() => fail('Observable should have rejected'),
          response => expect(response).toEqual(errorObj));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
      expect(request.request.params.get('subType')).toEqual(prefType);
      expect(request.request.params.get('type')).toEqual(`${SETTING}Preference`);
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.createUserPreference(prefType, this.newRecord)
        .subscribe(() => expect(true).toBeTrue(),
          () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
      request.flush('newId');
    });
  });
  describe('should retrieve a list preference groups', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/groups`;
    });
    it('unless an error occurs', function() {
      service.getPreferenceGroups()
        .subscribe(() => {
          fail('Observable should have rejected');
        }, (response) => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.getPreferenceGroups()
        .subscribe(response => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush([{'@id': 'test'}]);
    });
  });
  describe('should retrieve a list of preference definitions', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/groups/${encodeURIComponent(prefGroup)}/definitions`;
    });
    it('unless an error occurs', function() {
      service.getPreferenceDefinitions(prefGroup)
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
      
    });
    it('successfully', function() {
      service.getPreferenceDefinitions(prefGroup)
        .subscribe(response => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush([{'@id': 'test'}]);
    });
  });
  describe('should retrieve a list of application settings', function() {
    beforeEach(function() {
      this.url = service.prefix;
    });
    it('unless an error occurs', function() {
      service.getApplicationSettings()
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
      
    });
    it('successfully', function() {
      service.getApplicationSettings()
        .subscribe(response => {
          expect(response).toEqual({'type': [{'@id': 'test'}]});
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush({'type': [{'@id': 'test'}]});
    });
  });
  describe('should get an application setting by type', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/types/${encodeURIComponent(appSettingType)}`;
    });
    it('unless an error occurs', function() {
      service.getApplicationSettingByType(appSettingType)
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET'); 
      request.flush('flush', { status: 400, statusText: error });
      
    });
    it('successfully', function() {
      service.getApplicationSettingByType(appSettingType)
        .subscribe(response => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET'); 
      request.flush([{'@id': 'test'}]);
    });
  });
  describe('should update an application setting', function() {
    beforeEach(function() {
      this.newRecord = {};
      this.url = `${service.prefix}/1234`;
    });
    it('unless an error occurs', function() {
      service.updateApplicationSetting('1234', appSettingType, this.newRecord)
        .subscribe(() => fail('Observable should have rejected'),
          response => expect(response).toEqual(errorObj));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.updateApplicationSetting('1234', appSettingType, this.newRecord)
        .subscribe(() => expect(true).toBeTrue(),
            () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
      expect(request.request.params.get('subType')).toEqual(appSettingType);
      expect(request.request.params.get('type')).toEqual(service.appSettingType.iri);
      request.flush(200);
    });
  });
  describe('should create an application setting', function() {
    beforeEach(function() {
      this.newRecord = {};
      this.url = service.prefix;
    });
    it('unless an error occurs', function() {
      service.createApplicationSetting(appSettingType, this.newRecord)
        .subscribe(() => fail('Observable should have rejected'),
          response => expect(response).toEqual(errorObj));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.createApplicationSetting(appSettingType, this.newRecord)
        .subscribe(() => expect(true).toBeTrue(),
          () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
      expect(request.request.params.get('subType')).toEqual(appSettingType);
      expect(request.request.params.get('type')).toEqual(service.appSettingType.iri);
      request.flush(200);
    });
  });
  describe('should retrieve a list of application setting groups', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/groups`;
    });
    it('unless an error occurs', function() {
      service.getApplicationSettingGroups()
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.getApplicationSettingGroups()
        .subscribe(response => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush([{'@id': 'test'}]);
    });
  });
  describe('should retrieve a list of application setting definitions', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/groups/${encodeURIComponent(appSettingGroup)}/definitions`;
    });
    it('unless an error occurs', function() {
      service.getApplicationSettingDefinitions(appSettingGroup)
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toBe(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
      
    });
    it('successfully', function() {
      service.getApplicationSettingDefinitions(appSettingGroup)
        .subscribe(response => {
          expect(response).toEqual([{'@id': 'test'}]);
        }, () => {
          fail('Observable should have resolved');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush([{'@id': 'test'}]);
    });
  });
});
