/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
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
import { cloneDeep } from 'lodash';

import { DCTERMS, OWL, RDF, RDFS, SETTING, SHACL, SHACL_FORM } from '../../prefixes';
import { JSONLDObject } from './JSONLDObject.interface';
import { SimpleSetting } from './simpleSetting.class';

describe('SimpleSetting', () => {
  const propertyShapeId = 'urn:PropertyShapeA';
  const applicationSettingNodeShape: JSONLDObject = {
    '@id': 'urn:CustomApplicationSetting',
    '@type': [`${OWL}Class`, `${SHACL}NodeShape`],
    [`${DCTERMS}description`]: [{ '@value': 'Test Application Setting' }],
    [`${RDFS}subClassOf`]: [{ '@id': `${SETTING}ApplicationSetting` }],
    [`${SHACL}property`]: [{ '@id': propertyShapeId }]
  };
  const preferenceNodeShape: JSONLDObject = {
    '@id': 'urn:CustomPreference',
    '@type': [`${OWL}Class`, `${SHACL}NodeShape`],
    [`${DCTERMS}description`]: [{ '@value': 'Test Preference' }],
    [`${RDFS}subClassOf`]: [{ '@id': `${SETTING}Preference` }],
    [`${SHACL}property`]: [{ '@id': propertyShapeId }]
  };
  const textPropertyShape: JSONLDObject = {
    '@id': propertyShapeId,
    '@type': [`${SHACL}PropertyShape`],
    [`${SHACL}path`]: [{ '@id': `${SETTING}hasDataValue` }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }]
  };

  it('should test whether a provided setting is a SimpleSetting or not', () => {
    expect(SimpleSetting.isSimpleSetting(applicationSettingNodeShape, {[propertyShapeId]: textPropertyShape})).toBeTrue();
    expect(SimpleSetting.isSimpleSetting(applicationSettingNodeShape, {})).toBeFalse();
    expect(SimpleSetting.isSimpleSetting(applicationSettingNodeShape, {
      [propertyShapeId]: { '@id': propertyShapeId, [`${SHACL}node`]: [{ '@id': 'test' }] }
    })).toBeFalse();
  });
  it('should create for a simple text application setting', () => {
    const setting = new SimpleSetting(applicationSettingNodeShape, {[propertyShapeId]: textPropertyShape});
    expect(setting.type).toEqual(applicationSettingNodeShape['@id']);
    expect(setting.formFieldPropertyShapes).toEqual([textPropertyShape]);
    expect(setting.label).toEqual('Test Application Setting');
    expect(setting.json).toEqual(applicationSettingNodeShape);
    expect(setting.formFieldProperties).toEqual([`${SETTING}hasDataValue`]);
    expect(setting.values).toEqual([]);
    expect(setting.topLevelSettingNodeshapeInstanceId).toBeUndefined();
    expect(setting.formFieldConfigs.length).toEqual(1);
    expect(setting.settingType).toEqual(`${SETTING}ApplicationSetting`);
  });
  it('should create for a simple text preference', () => {
    const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
    expect(setting.type).toEqual(preferenceNodeShape['@id']);
    expect(setting.formFieldPropertyShapes).toEqual([textPropertyShape]);
    expect(setting.label).toEqual('Test Preference');
    expect(setting.json).toEqual(preferenceNodeShape);
    expect(setting.formFieldProperties).toEqual([`${SETTING}hasDataValue`]);
    expect(setting.values).toEqual([]);
    expect(setting.topLevelSettingNodeshapeInstanceId).toBeUndefined();
    expect(setting.formFieldConfigs.length).toEqual(1);
    expect(setting.settingType).toEqual(`${SETTING}Preference`);
  });
  it('should create for a preference with a checkbox or radio input', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': `${SETTING}hasDataValue` }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = {
      '@id': '_:b1',
      [`${RDF}first`]: [{ '@value': 'A' }],
      [`${RDF}rest`]: [{ '@value': '_:b2' }],
    };
    const bnode2: JSONLDObject = {
      '@id': '_:b2',
      [`${RDF}first`]: [{ '@value': 'B' }],
      [`${RDF}rest`]: [{ '@value': `${RDF}nil` }],
    };
    const setting = new SimpleSetting(preferenceNodeShape, {
      [propertyShapeId]: propertyShape,
      [bnode1['@id']]: bnode1,
      [bnode2['@id']]: bnode2,
    });
    expect(setting.type).toEqual(preferenceNodeShape['@id']);
    expect(setting.formFieldPropertyShapes).toEqual([propertyShape]);
    expect(setting.label).toEqual('Test Preference');
    expect(setting.json).toEqual(preferenceNodeShape);
    expect(setting.formFieldProperties).toEqual([`${SETTING}hasDataValue`]);
    expect(setting.values).toEqual([]);
    expect(setting.topLevelSettingNodeshapeInstanceId).toBeUndefined();
    expect(setting.formFieldConfigs.length).toEqual(1);
    expect(setting.settingType).toEqual(`${SETTING}Preference`);
  });
  it('should populate the Setting given a filled in setting with only one data value', () => {
    const settingValue = {
      '@id': 'uuid',
      '@type': [preferenceNodeShape['@id'], `${SETTING}Preference`, `${SETTING}Setting`, `${OWL}Thing`],
      [`${SETTING}hasDataValue`]: [{ '@value': 'A' }]
    };
    const settingValues = [settingValue, {'@id': 'other'}];
    const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
    setting.populate(settingValues);
    expect(setting.values).toEqual([settingValue]);
    expect(setting.topLevelSettingNodeshapeInstanceId).toEqual(settingValue['@id']);
  });
  it('should populate the Setting given a filled in setting with more than one data value', () => {
    const settingValue = {
      '@id': 'uuid',
      '@type': [preferenceNodeShape['@id'], `${SETTING}Preference`, `${SETTING}Setting`, `${OWL}Thing`],
      [`${SETTING}hasDataValue`]: [{ '@value': 'B' }, { '@value': 'A'}]
    };
    const settingValues = [settingValue, {'@id': 'other'}];
    const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
    setting.populate(settingValues);
    expect(setting.values).toEqual([settingValue]);
    expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'A' }, { '@value': 'B' }]);
    expect(setting.topLevelSettingNodeshapeInstanceId).toEqual(settingValue['@id']);
  });
  it('should test whether the Setting has been populated', () => {
    const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
    expect(setting.exists()).toBeFalse();
    const settingValue = {
      '@id': 'uuid',
      '@type': [preferenceNodeShape['@id'], `${SETTING}Preference`, `${SETTING}Setting`, `${OWL}Thing`],
      [`${SETTING}hasDataValue`]: [{ '@value': 'A' }]
    };
    setting.populate([settingValue]);
    expect(setting.exists()).toBeTrue();
  });
  describe('should update the Setting with form values', () => {
    describe('if the Setting has been populated', () => {
      const settingValue = {
        '@id': 'uuid',
        '@type': [preferenceNodeShape['@id'], `${SETTING}Preference`, `${SETTING}Setting`, `${OWL}Thing`],
        [`${SETTING}hasDataValue`]: [{ '@value': 'A' }]
      };
      it('and the value is a simple string', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: 'NEW'
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        setting.populate([settingValue]);
        expect(setting.values).toEqual([settingValue]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toEqual(settingValue['@id']);
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW' }]);
      });
      it('and the value is an array of strings', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: ['NEW1', 'NEW2']
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        setting.populate([settingValue]);
        expect(setting.values).toEqual([settingValue]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toEqual(settingValue['@id']);
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW1' }, { '@value': 'NEW2' }]);
      });
      it('and the value is an array of nested strings', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: [
            {[`${SETTING}hasDataValue0`]: 'NEW1'},
            {[`${SETTING}hasDataValue1`]: 'NEW2'}
          ]
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        setting.populate([settingValue]);
        expect(setting.values).toEqual([settingValue]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toEqual(settingValue['@id']);
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW1' }, { '@value': 'NEW2' }]);
      });
      it('and the value is an array of nested strings with one value removed', () => {
        const settingValueClone: JSONLDObject = cloneDeep(settingValue);
        settingValueClone[`${SETTING}hasDataValue`] = [{ '@value': 'A' }, { '@value': 'B' }];
        const formValues = {
          [`${SETTING}hasDataValue`]: [
            {[`${SETTING}hasDataValue1`]: 'B'}
          ]
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        setting.populate([settingValue]);
        expect(setting.values).toEqual([settingValue]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toEqual(settingValue['@id']);
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'B' }]);
      });
      it('and the value has been removed', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: ''
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        setting.populate([settingValue]);
        expect(setting.values).toEqual([settingValue]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toEqual(settingValue['@id']);
        expect(setting.values[0][`${SETTING}hasDataValue`]).toBeUndefined();
      });
    });
    describe('if the Setting has not been populated', () => {
      it('and the value is a simple string', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: 'NEW'
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        expect(setting.values).toEqual([]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toContain('http://mobi.solutions/setting#');
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW' }]);
      });
      it('and the value is an array of strings', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: ['NEW1', 'NEW2']
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        expect(setting.values).toEqual([]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toContain('http://mobi.solutions/setting#');
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW1' }, { '@value': 'NEW2' }]);
      });
      it('and the value is an array of nested strings', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: [
            { [`${SETTING}hasDataValue0`]: 'NEW1' },
            { [`${SETTING}hasDataValue1`]: 'NEW2' }
          ]
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        expect(setting.values).toEqual([]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toContain('http://mobi.solutions/setting#');
        expect(setting.values[0][`${SETTING}hasDataValue`]).toEqual([{ '@value': 'NEW1' }, { '@value': 'NEW2' }]);
      });
      it('and the value has been removed', () => {
        const formValues = {
          [`${SETTING}hasDataValue`]: ''
        };
        const setting = new SimpleSetting(preferenceNodeShape, {[propertyShapeId]: textPropertyShape});
        expect(setting.values).toEqual([]);

        setting.updateWithFormValues(formValues);
        expect(setting.values.length).toEqual(1);
        expect(setting.values[0]['@id']).toContain('http://mobi.solutions/setting#');
        expect(setting.values[0][`${SETTING}hasDataValue`]).toBeUndefined();
      });
    });
  });
});
