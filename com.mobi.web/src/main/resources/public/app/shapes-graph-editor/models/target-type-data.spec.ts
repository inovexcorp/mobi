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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { ShaclTargetDetector, SingleTargetTypeData } from './target-type-data';
import {
  TARGET_NODE,
  TARGET_CLASS,
  TARGET_OBJECTS_OF,
  TARGET_SUBJECTS_OF,
  IMPLICIT_REFERENCE
} from './constants';
import { TARGET_SHAPES } from './shacl-test-data';

describe('ShaclTargetDetector', () => {
  let detector: ShaclTargetDetector;
  beforeEach(() => {
    detector = new ShaclTargetDetector();
  });
  it('should be created', () => {
    expect(detector).toBeTruthy();
  });
  it('should return null if no target property is found and no implicit reference', () => {
    expect(detector.detect(TARGET_SHAPES.edgeCases.NO_TARGET)).toBeNull();
  });
  describe('priority and edge Cases', () => {
    it('should prioritize sh:targetNode over sh:targetClass if both are present', () => {
      const result = detector.detect(TARGET_SHAPES.edgeCases.PRIORITY_CHECK);
      expect(result?.targetType).toEqual(TARGET_NODE);
      expect((result as SingleTargetTypeData).value).toEqual('ex:PreferredNode');
    });
    it('should return the highest priority target when all target types are present', () => {
      const result = detector.detect(TARGET_SHAPES.edgeCases.ALL_TARGETS);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: 'ex:NodeO'
      });
    });
    it('should correctly select the valid target when mixed with empty/null targets', () => {
      const result = detector.detect(TARGET_SHAPES.edgeCases.MIXED_EMPTY_AND_VALID_TARGETS);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: 'ex:ValidNode'
      });
    });
  });
  describe('implicit class reference', () => {
    it('should detect an implicit target if @type contains rdfs:Class', () => {
      const result = detector.detect(TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE);
      expect(result).toEqual({
        multiSelect: false,
        targetType: IMPLICIT_REFERENCE,
        value: 'ex:MyRDFSClass'
      });
    });
    it('should detect an implicit target if @type contains owl:Class', () => {
      const result = detector.detect(TARGET_SHAPES.implicit.OWL_CLASS_REFERENCE);
      expect(result).toEqual({
        multiSelect: false,
        targetType: IMPLICIT_REFERENCE,
        value: 'ex:MyOWLClass'
      });
    });
    it('should prioritize implicit class target over explicit sh:targetNode ', () => {
      const result = detector.detect(TARGET_SHAPES.implicit.WITH_EXPLICIT_TARGET_PRIORITY);
      expect(result).toEqual({
        multiSelect: false,
        targetType: IMPLICIT_REFERENCE,
        value: 'ex:MyClassPrioritized'
      });
    });
    it('should detect an implicit target on a shape that is a blank node', () => {
      const result = detector.detect(TARGET_SHAPES.implicit.BLANK_NODE_SHAPE_IMPLICIT);
      expect(result).toEqual({
        multiSelect: false,
        targetType: IMPLICIT_REFERENCE,
        value: '_:implicitShape1'
      });
    });
  });
  describe('target node', () => {
    it('should detect a single IRI', () => {
      const result = detector.detect(TARGET_SHAPES.targetNode.IRI);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: 'ex:SpecificNode'
      });
    });
    it('should detect a literal value', () => {
      const result = detector.detect(TARGET_SHAPES.targetNode.LITERAL);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: 'SomeLiteralValue'
      });
    });
    it('should detect a blank node IRI', () => {
      const result = detector.detect(TARGET_SHAPES.edgeCases.TARGET_IS_BLANK_NODE);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: '_:b1'
      });
    });
    it('should take the first value if multiple are provided', () => {
      const result = detector.detect(TARGET_SHAPES.targetNode.MULTIPLE_IRIS);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: 'ex:Node1'
      });
    });
    it('should return an empty string if value is null or an empty array', () => {
      let result = detector.detect(TARGET_SHAPES.targetNode.WITH_NULL_VALUE);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: ''
      });

      result = detector.detect(TARGET_SHAPES.targetNode.WITH_EMPTY_ARRAY);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_NODE,
        value: ''
      });
    });
  });
  describe('target class', () => {
    it('should detect a single IRI', () => {
      const result = detector.detect(TARGET_SHAPES.targetClass.IRI);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_CLASS,
        value: 'ex:MyClass'
      });
    });
    it('should take the first value if multiple classes are provided', () => {
      const result = detector.detect(TARGET_SHAPES.targetClass.MULTIPLE_IRIS);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_CLASS,
        value: 'ex:ClassA'
      });
    });
    it('should return an empty string if value is null or an empty array', () => {
      let result = detector.detect(TARGET_SHAPES.targetClass.WITH_NULL_VALUE);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_CLASS,
        value: ''
      });
      result = detector.detect(TARGET_SHAPES.targetClass.WITH_EMPTY_ARRAY);
      expect(result).toEqual({
        multiSelect: false,
        targetType: TARGET_CLASS,
        value: ''
      });
    });
  });
  describe('target objects of', () => {
    it('should detect a single IRI as an array', () => {
      const result = detector.detect(TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_OBJECTS_OF,
        values: ['ex:prop1']
      });
    });
    it('should detect multiple IRIs as an array', () => {
      const result = detector.detect(TARGET_SHAPES.targetObjectsOf.MULTIPLE_VALUES);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_OBJECTS_OF,
        values: ['ex:prop1', 'ex:prop2']
      });
    });
    it('should return an empty array if property is null or an empty array', () => {
      let result = detector.detect(TARGET_SHAPES.targetObjectsOf.WITH_NULL_VALUE);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_OBJECTS_OF,
        values: []
      });

      result = detector.detect(TARGET_SHAPES.targetObjectsOf.WITH_EMPTY_ARRAY);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_OBJECTS_OF,
        values: []
      });
    });
    it('should return an empty array if property contains only non-IRI values', () => {
      const result = detector.detect(TARGET_SHAPES.targetObjectsOf.WITH_INVALID_VALUES);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_OBJECTS_OF,
        values: []
      });
    });
  });
  describe('target subjects of', () => {
    it('should detect multiple IRIs', () => {
      const result = detector.detect(TARGET_SHAPES.targetSubjectsOf.MULTIPLE_VALUES);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_SUBJECTS_OF,
        values: ['ex:propA', 'ex:propB']
      });
    });
    it('should return an empty array if property is null or an empty array', () => {
      let result = detector.detect(TARGET_SHAPES.targetSubjectsOf.WITH_NULL_VALUE);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_SUBJECTS_OF,
        values: []
      });
      result = detector.detect(TARGET_SHAPES.targetSubjectsOf.WITH_EMPTY_ARRAY);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_SUBJECTS_OF,
        values: []
      });
    });
    it('should return an empty array if property contains only non-IRI values', () => {
      const result = detector.detect(TARGET_SHAPES.targetSubjectsOf.WITH_INVALID_VALUES);
      expect(result).toEqual({
        multiSelect: true,
        targetType: TARGET_SUBJECTS_OF,
        values: []
      });
    });
  });
});
