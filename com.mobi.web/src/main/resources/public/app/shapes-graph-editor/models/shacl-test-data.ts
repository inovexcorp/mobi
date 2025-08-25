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
import { FormControl } from '@angular/forms';

import { Constraint } from './constraint.interface';
import { JSONLDId } from '../../shared/models/JSONLDId.interface';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../shared/models/JSONLDValue.interface';
import { PathNode } from './property-shape.interface';
import { OWL, RDF, RDFS, SH, XSD } from '../../prefixes';
import { TARGET_NODE, TARGET_CLASS, TARGET_OBJECTS_OF, TARGET_SUBJECTS_OF } from './constants';

/**
 * Recursively applies Object.freeze() to an object and all of its nested properties,
 * making the entire data structure immutable.
 *
 * @template {object} T The type of the object being frozen.
 * @param {T} obj The object to make deeply immutable.
 * @returns {T} The same object reference, now deeply frozen.
 */
function deepFreeze<T>(obj: T): T {
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj)[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}
/**
 * SHACL Target Shape Test Cases
 * - Edge cases:
 *   - Shapes with no targets
 *   - Target priority checks (explicit > implicit)
 *   - Shapes mixing valid/empty/null targets
 *   - Blank node targets
 * - Implicit Target:
 *   - Shapes using implicit rdfs:Class or owl:Class
 *   - Implicit target with explicit override
 *   - Blank node shape with implicit class
 * - Target Node:
 *   - Single IRI
 *   - Multiple IRIs
 *   - Duplicate IRIs
 *   - Literal values
 *   - Mixed IRI + literal
 *   - Null or empty values
 * - Target Class
 *   - Single or multiple IRIs
 *   - Null or empty values
 * - TargetObjectsOf:
 *   - Single or multiple properties
 *   - Null, empty or invalid values
 * - TargetSubjectsOf:
 *   - Single or multiple properties
 *   - Null, empty or invalid values
 */
const RDFS_CLASS = `${RDFS}Class`;
const OWL_CLASS = `${OWL}Class`;
export const TARGET_SHAPES = deepFreeze({
  // === Edge Cases ===
  edgeCases: {
    ALL_TARGETS: {
      '@id': 'ex:NodeShape_AllTargets',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [{ '@id': 'ex:ClassP' }],
      [TARGET_NODE]: [{ '@id': 'ex:NodeO' }],
      [TARGET_OBJECTS_OF]: [{ '@id': 'ex:objPropQ' }],
      [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:subPropR' }],
    } as JSONLDObject,
    MIXED_EMPTY_AND_VALID_TARGETS: {
      '@id': 'ex:NodeShape_MixedTargets',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [],
      [TARGET_NODE]: [{ '@id': 'ex:ValidNode' }],
      [TARGET_OBJECTS_OF]: null,
    } as JSONLDObject,
    NO_TARGET: {
      '@id': 'ex:NodeShape_NoTarget',
      '@type': [`${SH}NodeShape`, 'some:OtherType'],
    } as JSONLDObject,
    NO_TARGET_WITHOUT_TYPE: {
      '@id': 'ex:NodeShape_NoTarget',
      '@type': ['some:OtherType'],
    } as JSONLDObject,
    PRIORITY_CHECK: {
      '@id': 'ex:NodeShape_PriorityOrder',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [{ '@id': 'ex:LessPreferredClass' }],
      [TARGET_NODE]: [{ '@id': 'ex:PreferredNode' }],
    } as JSONLDObject,
    TARGET_IS_BLANK_NODE: {
      '@id': 'ex:NodeShape_TargetBlankNode',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [{ '@id': '_:b1' }],
    } as JSONLDObject,
  },
  // === Implicit Targets ===
  implicit: {
    BLANK_NODE_SHAPE_IMPLICIT: {
      '@id': '_:implicitShape1',
      '@type': [`${SH}NodeShape`, RDFS_CLASS],
    } as JSONLDObject,
    OWL_CLASS_REFERENCE: {
      '@id': 'ex:MyOWLClass',
      '@type': [`${SH}NodeShape`, OWL_CLASS],
    } as JSONLDObject,
    RDFS_CLASS_REFERENCE: {
      '@id': 'ex:MyRDFSClass',
      '@type': [`${SH}NodeShape`, RDFS_CLASS],
    } as JSONLDObject,
    RDFS_OWL_CLASS_REFERENCE: {
      '@id': 'ex:MyRdfsOwlClass',
      '@type': [`${SH}NodeShape`, RDFS_CLASS, OWL_CLASS],
    } as JSONLDObject,
    WITH_EXPLICIT_TARGET_PRIORITY: {
      '@id': 'ex:MyClassPrioritized',
      '@type': [`${SH}NodeShape`, RDFS_CLASS],
      [TARGET_NODE]: [{ '@id': 'ex:AnotherNode' }],
    } as JSONLDObject,
  },
  // === Target Class ===
  targetClass: {
    IRI: {
      '@id': 'ex:NodeShape_TargetClassIRI',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }],
    } as JSONLDObject,
    MULTIPLE_IRIS: {
      '@id': 'ex:NodeShape_TargetClassMultipleIRIs',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [
        { '@id': 'ex:ClassA' },
        { '@id': 'ex:ClassB' },
      ],
    } as JSONLDObject,
    WITH_EMPTY_ARRAY: {
      '@id': 'ex:NodeShape_TargetClassEmptyArray',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: [],
    } as JSONLDObject,

    WITH_NULL_VALUE: {
      '@id': 'ex:NodeShape_TargetClassNull',
      '@type': [`${SH}NodeShape`],
      [TARGET_CLASS]: null,
    } as JSONLDObject,
  },
  // === Target Node ===
  targetNode: {
    DUPLICATE_IRIS: {
      '@id': 'ex:NodeShape_TargetNodeDuplicateIRIs',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [
        { '@id': 'ex:Node1' },
        { '@id': 'ex:Node1' },
      ],
    } as JSONLDObject,
    IRI: {
      '@id': 'ex:NodeShape_TargetNodeIRI',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }],
    } as JSONLDObject,
    LITERAL: {
      '@id': 'ex:NodeShape_TargetNodeLiteral',
      [TARGET_NODE]: [{ '@value': 'SomeLiteralValue' }],
    } as JSONLDObject,
    MIXED_IRI_AND_LITERAL: {
      '@id': 'ex:NodeShape_TargetNodeMixed',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [
        { '@id': 'ex:SpecificNode' },
        { '@value': 'SomeLiteralValue' },
      ],
    } as JSONLDObject,
    MULTIPLE_IRIS: {
      '@id': 'ex:NodeShape_TargetNodeMultipleIRIs',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [
        { '@id': 'ex:Node1' },
        { '@id': 'ex:Node2' },
      ],
    } as JSONLDObject,
    WITH_EMPTY_ARRAY: {
      '@id': 'ex:NodeShape_TargetNodeEmptyArray',
      '@type': [`${SH}NodeShape`],
      [TARGET_NODE]: [],
    } as JSONLDObject,
    WITH_NULL_VALUE: {
      '@id': 'ex:NodeShape_TargetNodeNull',
      [TARGET_NODE]: null,
    } as JSONLDObject,
  },
  // === Target Objects Of ===
  targetObjectsOf: {
    MULTIPLE_VALUES: {
      '@id': 'ex:NodeShape_TargetObjectsOfMultiple',
      '@type': [`${SH}NodeShape`],
      [TARGET_OBJECTS_OF]: [
        { '@id': 'ex:prop1' },
        { '@id': 'ex:prop2' },
      ],
    } as JSONLDObject,
    SINGLE_VALUE: {
      '@id': 'ex:NodeShape_TargetObjectsOfSingle',
      '@type': [`${SH}NodeShape`],
      [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }],
    } as JSONLDObject,
    WITH_EMPTY_ARRAY: {
      '@id': 'ex:NodeShape_TargetObjectsOfEmptyArray',
      '@type': [`${SH}NodeShape`],
      [TARGET_OBJECTS_OF]: [],
    } as JSONLDObject,
    WITH_INVALID_VALUES: {
      '@id': 'ex:NodeShape_TargetObjectsOfInvalid',
      '@type': [`${SH}NodeShape`],
      [TARGET_OBJECTS_OF]: [
        'someLiteral',
        { notId: 'value' },
        123,
        { '@value': 'literal' },
      ],
    } as JSONLDObject,
    WITH_NULL_VALUE: {
      '@id': 'ex:NodeShape_TargetObjectsOfNull',
      '@type': [`${SH}NodeShape`],
      [TARGET_OBJECTS_OF]: null,
    } as JSONLDObject,
  },
  // === Target Subjects Of ===
  targetSubjectsOf: {
    MULTIPLE_VALUES: {
      '@id': 'ex:NodeShape_TargetSubjectsOfMultiple',
      '@type': [`${SH}NodeShape`],
      [TARGET_SUBJECTS_OF]: [
        { '@id': 'ex:propA' },
        { '@id': 'ex:propB' },
      ],
    } as JSONLDObject,
    SINGLE_VALUE: {
      '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
      '@type': [`${SH}NodeShape`],
      [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }],
    } as JSONLDObject,
    WITH_EMPTY_ARRAY: {
      '@id': 'ex:NodeShape_TargetSubjectsOfEmptyArray',
      '@type': [`${SH}NodeShape`],
      [TARGET_SUBJECTS_OF]: [],
    } as JSONLDObject,
    WITH_INVALID_VALUES: {
      '@id': 'ex:NodeShape_TargetSubjectsOfInvalid',
      '@type': [`${SH}NodeShape`],
      [TARGET_SUBJECTS_OF]: [
        { '@value': 'cannot be a literal' },
        'string',
        null,
      ],
    } as JSONLDObject,
    WITH_NULL_VALUE: {
      '@id': 'ex:NodeShape_TargetSubjectsOfNull',
      '@type': [`${SH}NodeShape`],
      [TARGET_SUBJECTS_OF]: null,
    } as JSONLDObject,
  },
});

// Test cases for SHACL Property Paths and Constraints
interface PathTestCase {
  iri: string,
  testName: string,
  jsonldMap: Record<string, JSONLDObject>,
  structure: PathNode,
  pathString: string,
  referencedIds: Set<string>,
  htmlCounts: {
    'mat-card': number,
    '.arrow-icon.inverse': number,
    '.arrow-icon.predicate': number,
    'app-add-path-node-hover-button.alt-button': number,
    'app-add-path-node-hover-button.seq-button': number,
    'fieldset.cardinality-container.zero-or-more': number,
    'fieldset.cardinality-container.one-or-more': number,
    'fieldset.cardinality-container.zero-or-one': number,
    'fieldset.alternative-list': number,
    '.alternative-separator': number
  }
}

export const pathTestCases: PathTestCase[] = [
  // This chunk of tests focuses on sequence paths
  {
    testName: 'one predicate path' ,
    iri: 'http://www.test.com/test#PropA',
    jsonldMap: {},
    structure: { type: 'IRI', iri: 'http://www.test.com/test#PropA', label: 'Prop A' },
    pathString: 'Prop A',
    referencedIds: new Set(),
    htmlCounts: {
      'mat-card': 1,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 1,
      'app-add-path-node-hover-button.alt-button': 1,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple predicate path (sequence path)',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        { type: 'IRI', iri: 'http://www.test.com/test#PropA', label: 'Prop A' },
        { type: 'IRI', iri: 'http://www.test.com/test#PropB', label: 'Prop B' },
      ]
    },
    pathString: 'Prop A / Prop B',
    referencedIds: new Set(['_:b1', '_:b2']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 2,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'one predicate path with special path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${SH}zeroOrMorePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      }
    },
    structure: {
      type: 'ZeroOrMore',
      path: {
        type: 'IRI',
        iri: 'http://www.test.com/test#PropA',
        label: 'Prop A'
      }
    },
    pathString: '( Prop A )*',
    referencedIds: new Set(['_:b1']),
    htmlCounts: {
      'mat-card': 1,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 1,
      'app-add-path-node-hover-button.alt-button': 1,
      'app-add-path-node-hover-button.seq-button': 2,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple predicate path with special paths',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b4'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}zeroOrMorePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}oneOrMorePath`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'ZeroOrMore',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropA',
            label: 'Prop A'
          }
        },
        {
          type: 'OneOrMore',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropB',
            label: 'Prop B'
          }
        }
      ]
    },
    pathString: '( Prop A )* / ( Prop B )+',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 2,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 3,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple predicate path with one special path one not',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}zeroOrMorePath`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'IRI',
          iri: 'http://www.test.com/test#PropA',
          label: 'Prop A'
        },
        {
          type: 'ZeroOrMore',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropB',
            label: 'Prop B'
          }
        }
      ]
    },
    pathString: 'Prop A / ( Prop B )*',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 2,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 2,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  // This chunk of tests focuses on inverse paths
  {
    testName: 'one inverse path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      }
    },
    structure: {
      type: 'Inverse',
      path: {
        type: 'IRI',
        iri: 'http://www.test.com/test#PropA',
        label: 'Prop A',
      }
    },
    pathString: '^( Prop A )',
    referencedIds: new Set(['_:b1']),
    htmlCounts: {
      'mat-card': 1,
      '.arrow-icon.inverse': 1,
      '.arrow-icon.predicate': 0,
      'app-add-path-node-hover-button.alt-button': 1,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple inverse path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b4'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'Inverse',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropA',
            label: 'Prop A',
          }
        },
        {
          type: 'Inverse',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropC',
            label: 'Prop C',
          }
        }
      ]
    },
    pathString: '^( Prop A ) / ^( Prop C )',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 2,
      '.arrow-icon.predicate': 0,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple inverse paths with special paths',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b5'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}zeroOrMorePath`]: [{
          '@id': '_:b4'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${SH}oneOrMorePath`]: [{
          '@id': '_:b6'
        }]
      },
      '_:b6': {
        '@id': '_:b6',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'ZeroOrMore',
          path: {
            type: 'Inverse',
            path: {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropA',
              label: 'Prop A',
            }
          }
        },
        {
          type: 'OneOrMore',
          path: {
            type: 'Inverse',
            path: {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropC',
              label: 'Prop C',
            }
          }
        }
      ]
    },
    pathString: '( ^( Prop A ) )* / ( ^( Prop C ) )+',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5', '_:b6']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 2,
      '.arrow-icon.predicate': 0,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 3,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple inverse path with one special path one not',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b4'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}oneOrMorePath`]: [{
          '@id': '_:b5'
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'Inverse',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropA',
            label: 'Prop A',
          }
        },
        {
          type: 'OneOrMore',
          path: {
            type: 'Inverse',
            path: {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropC',
              label: 'Prop C',
            }
          }
        }
      ]
    },
    pathString: '^( Prop A ) / ( ^( Prop C ) )+',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 2,
      '.arrow-icon.predicate': 0,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 2,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  // This chunk of tests focuses on alternate path
  {
    testName: 'one alternate path',
    iri: '_:b3',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}alternativePath`]: [{
          '@id': '_:b1'
        }]
      }
    },
    structure: {
      type: 'Alternative',
      items: [
        {
          type: 'IRI',
          iri: 'http://www.test.com/test#PropA',
          label: 'Prop A'
        },
        {
          type: 'IRI',
          iri: 'http://www.test.com/test#PropB',
          label: 'Prop B'
        }
      ]
    },
    pathString: 'Prop A | Prop B',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 2,
      'app-add-path-node-hover-button.alt-button': 1,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 1,
      '.alternative-separator': 1
    }
  },
  {
    testName: 'one alternate path with special path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${SH}zeroOrMorePath`]: [{
          '@id': '_:b4'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b3'
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}alternativePath`]: [{
          '@id': '_:b2'
        }]
      },
    },
    structure: {
      type: 'ZeroOrMore',
      path: {
        type: 'Alternative',
        items: [
          {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropA',
            label: 'Prop A'
          },
          {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropB',
            label: 'Prop B'
          }
        ]
      }
    },
    pathString: '( Prop A | Prop B )*',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 2,
      'app-add-path-node-hover-button.alt-button': 1,
      'app-add-path-node-hover-button.seq-button': 2,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 1,
      '.alternative-separator': 1
    }
  },
  {
    testName: 'multiple alternative paths',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b5'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b8'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b4'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${SH}alternativePath`]: [{
          '@id': '_:b3'
        }]
      },
      '_:b6': {
        '@id': '_:b6',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b7'
        }]
      },
      '_:b7': {
        '@id': '_:b7',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropD'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b8': {
        '@id': '_:b8',
        [`${SH}alternativePath`]: [{
          '@id': '_:b6'
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'Alternative',
          items: [
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropA',
              label: 'Prop A'
            },
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropB',
              label: 'Prop B'
            }
          ]
        },
        {
          type: 'Alternative',
          items: [
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropC',
              label: 'Prop C'
            },
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropD',
              label: 'Prop D'
            }
          ]
        }
      ]
    },
    pathString: 'Prop A | Prop B / Prop C | Prop D',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5', '_:b6', '_:b7', '_:b8']),
    htmlCounts: {
      'mat-card': 4,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 4,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 2,
      '.alternative-separator': 2
    }
  },
  {
    testName: 'multiple predicate path with alternate paths special paths',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b7'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}zeroOrOnePath`]: [{
          '@id': '_:b6'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b5'
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b6': {
        '@id': '_:b6',
        [`${SH}alternativePath`]: [{
          '@id': '_:b4'
        }]
      },
      '_:b7': {
        '@id': '_:b7',
        [`${SH}oneOrMorePath`]: [{
          '@id': '_:b10'
        }]
      },
      '_:b8': {
        '@id': '_:b8',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b9'
        }]
      },
      '_:b9': {
        '@id': '_:b9',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropD'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b10': {
        '@id': '_:b10',
        [`${SH}alternativePath`]: [{
          '@id': '_:b8'
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'ZeroOrOne',
          path: {
            type: 'Alternative',
            items: [
              {
                type: 'IRI',
                iri: 'http://www.test.com/test#PropA',
                label: 'Prop A'
              },
              {
                type: 'IRI',
                iri: 'http://www.test.com/test#PropB',
                label: 'Prop B'
              }
            ]
          }
        },
        {
          type: 'OneOrMore',
          path: {
            type: 'Alternative',
            items: [
              {
                type: 'IRI',
                iri: 'http://www.test.com/test#PropC',
                label: 'Prop C'
              },
              {
                type: 'IRI',
                iri: 'http://www.test.com/test#PropD',
                label: 'Prop D'
              }
            ]
          }
        }
      ]
    },
    pathString: '( Prop A | Prop B )? / ( Prop C | Prop D )+',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5', '_:b6', '_:b7', '_:b8', '_:b9', '_:b10'])
    ,
    htmlCounts: {
      'mat-card': 4,
      '.arrow-icon.inverse': 0,
      '.arrow-icon.predicate': 4,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 3,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 1,
      'fieldset.alternative-list': 2,
      '.alternative-separator': 2
    }
  },
  {
    testName: 'one predicate path, one inverse path, both with alternates, predicate path with special path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b4'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b8'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b3'
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${RDF}first`]: [{
          '@id': '_:b11'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}oneOrMorePath`]: [{
          '@id': '_:b5'
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b6': {
        '@id': '_:b6',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b7'
        }]
      },
      '_:b7': {
        '@id': '_:b7',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b8': {
        '@id': '_:b8',
        [`${SH}alternativePath`]: [{
          '@id': '_:b6'
        }]
      },
      '_:b9': {
        '@id': '_:b9',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropD'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b10'
        }]
      },
      '_:b10': {
        '@id': '_:b10',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropE'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b11': {
        '@id': '_:b11',
        [`${SH}alternativePath`]: [{
          '@id': '_:b9'
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'OneOrMore',
          path: {
            type: 'Inverse',
            path: {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropA',
              label: 'Prop A',
            },
          }
        },
        {
          type: 'Alternative',
          items: [
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropB',
              label: 'Prop B',
            },
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropC',
              label: 'Prop C',
            },
          ]
        },
        {
          type: 'Alternative',
          items: [
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropD',
              label: 'Prop D',
            },
            {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropE',
              label: 'Prop E',
            },
          ]
        }
      ]
    },
    pathString: '( ^( Prop A ) )+ / Prop B | Prop C / Prop D | Prop E',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5', '_:b6', '_:b7', '_:b8', '_:b9', '_:b10', '_:b11']),
    htmlCounts: {
      'mat-card': 5,
      '.arrow-icon.inverse': 1,
      '.arrow-icon.predicate': 4,
      'app-add-path-node-hover-button.alt-button': 3,
      'app-add-path-node-hover-button.seq-button': 2,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 2,
      '.alternative-separator': 2
    }
  },
  //  This chunk of tests focuses on mixed predicate and inverse paths
  {
    testName: 'predicate path to inverse path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropC'
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'IRI',
          iri: 'http://www.test.com/test#PropA',
          label: 'Prop A'
        },
        {
          type: 'Inverse',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropC',
            label: 'Prop C',
          }
        }
      ]
    },
    pathString: 'Prop A / ^( Prop C )',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 1,
      '.arrow-icon.predicate': 1,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'inverse path to predicate path',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': 'http://www.test.com/test#PropD'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }]
      }
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'Inverse',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropB',
            label: 'Prop B',
          }
        },
        {
          type: 'IRI',
          iri: 'http://www.test.com/test#PropD',
          label: 'Prop D'
        }
      ]
    },
    pathString: '^( Prop B ) / Prop D',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 1,
      '.arrow-icon.predicate': 1,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 1,
      'fieldset.cardinality-container.zero-or-more': 0,
      'fieldset.cardinality-container.one-or-more': 0,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  },
  {
    testName: 'multiple predicate path with inverse and specialty paths',
    iri: '_:b1',
    jsonldMap: {
      '_:b1': {
        '@id': '_:b1',
        [`${RDF}first`]: [{
          '@id': '_:b3'
        }],
        [`${RDF}rest`]: [{
          '@id': '_:b2'
        }]
      },
      '_:b2': {
        '@id': '_:b2',
        [`${RDF}first`]: [{
          '@id': '_:b4'
        }],
        [`${RDF}rest`]: [{
          '@id': `${RDF}nil`
        }]
      },
      '_:b3': {
        '@id': '_:b3',
        [`${SH}zeroOrMorePath`]: [{
          '@id': 'http://www.test.com/test#PropA'
        }]
      },
      '_:b4': {
        '@id': '_:b4',
        [`${SH}oneOrMorePath`]: [{
          '@id': '_:b5'
        }]
      },
      '_:b5': {
        '@id': '_:b5',
        [`${SH}inversePath`]: [{
          '@id': 'http://www.test.com/test#PropB'
        }]
      },
    },
    structure: {
      type: 'Sequence',
      items: [
        {
          type: 'ZeroOrMore',
          path: {
            type: 'IRI',
            iri: 'http://www.test.com/test#PropA',
            label: 'Prop A',
          }
        },
        {
          type: 'OneOrMore',
          path: {
            type: 'Inverse',
            path: {
              type: 'IRI',
              iri: 'http://www.test.com/test#PropB',
              label: 'Prop B',
            }
          }
        }
      ]
    },
    pathString: '( Prop A )* / ( ^( Prop B ) )+',
    referencedIds: new Set(['_:b1', '_:b2', '_:b3', '_:b4', '_:b5']),
    htmlCounts: {
      'mat-card': 2,
      '.arrow-icon.inverse': 1,
      '.arrow-icon.predicate': 1,
      'app-add-path-node-hover-button.alt-button': 2,
      'app-add-path-node-hover-button.seq-button': 3,
      'fieldset.cardinality-container.zero-or-more': 1,
      'fieldset.cardinality-container.one-or-more': 1,
      'fieldset.cardinality-container.zero-or-one': 0,
      'fieldset.alternative-list': 0,
      '.alternative-separator': 0
    }
  }
];

interface ConstraintTestCase {
  testName: string,
  key: string,
  values: (JSONLDId|JSONLDValue)[],
  bnodes: JSONLDObject[],
  constraint: Constraint,
  separate?: boolean,
  control: FormControl
}

export const constraintTestCases: ConstraintTestCase[] = [
  {
    testName: 'sh:class',
    key: `${SH}class`,
    values: [
      { '@id': 'http://www.test.com/test#ClassA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}class`,
      constraintLabel: 'Class',
      value: [{ chosenValue: 'http://www.test.com/test#ClassA', label: 'Class A' }],
    },
    control: new FormControl({ label: 'Class A', value: 'http://www.test.com/test#ClassA' })
  },
  {
    testName: 'sh:datatype',
    key: `${SH}datatype`,
    values: [
      { '@id': 'http://www.test.com/test#DatatypeA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}datatype`,
      constraintLabel: 'Datatype',
      value: [{ chosenValue: 'http://www.test.com/test#DatatypeA', label: 'Datatype A' }],
    },
    control: new FormControl({ label: 'Datatype A', value: 'http://www.test.com/test#DatatypeA' })
  },
  {
    testName: 'sh:nodeKind',
    key: `${SH}nodeKind`,
    values: [
      { '@id': `${SH}Literal` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}nodeKind`,
      constraintLabel: 'Node Kind',
      value: [{ chosenValue: `${SH}Literal`, label: 'Literal' }],
    },
    control: new FormControl({ label: 'Literal', value: `${SH}Literal` })
  },
  {
    testName: 'sh:minCount',
    key: `${SH}minCount`,
    values: [
      { '@value': '1', '@type': `${XSD}integer` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}minCount`,
      constraintLabel: 'Min Count',
      value: [{ chosenValue: '1', label: '1' }],
    },
    control: new FormControl('1')
  },
  {
    testName: 'sh:maxCount',
    key: `${SH}maxCount`,
    values: [
      { '@value': '5', '@type': `${XSD}integer` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}maxCount`,
      constraintLabel: 'Max Count',
      value: [{ chosenValue: '5', label: '5' }],
    },
    control: new FormControl('5')
  },
  {
    testName: 'sh:minExclusive',
    key: `${SH}minExclusive`,
    values: [
      { '@value': '10.1', '@type': `${XSD}double` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}minExclusive`,
      constraintLabel: 'Min Exclusive',
      value: [{ chosenValue: '10.1', label: '10.1' }],
    },
    control: new FormControl('10.1')
  },
  {
    testName: 'sh:minInclusive',
    key: `${SH}minInclusive`,
    values: [
      { '@value': '10.1', '@type': `${XSD}double` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}minInclusive`,
      constraintLabel: 'Min Inclusive',
      value: [{ chosenValue: '10.1', label: '10.1' }],
    },
    control: new FormControl('10.1')
  },
  {
    testName: 'sh:maxExclusive',
    key: `${SH}maxExclusive`,
    values: [
      { '@value': '10.1', '@type': `${XSD}double` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}maxExclusive`,
      constraintLabel: 'Max Exclusive',
      value: [{ chosenValue: '10.1', label: '10.1' }],
    },
    control: new FormControl('10.1')
  },
  {
    testName: 'sh:maxInclusive',
    key: `${SH}maxInclusive`,
    values: [
      { '@value': '10.1', '@type': `${XSD}double` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}maxInclusive`,
      constraintLabel: 'Max Inclusive',
      value: [{ chosenValue: '10.1', label: '10.1' }],
    },
    control: new FormControl('10.1')
  },
  {
    testName: 'sh:minLength',
    key: `${SH}minLength`,
    values: [
      { '@value': '3', '@type': `${XSD}integer` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}minLength`,
      constraintLabel: 'Min Length',
      value: [{ chosenValue: '3', label: '3' }],
    },
    control: new FormControl('3')
  },
  {
    testName: 'sh:maxLength',
    key: `${SH}maxLength`,
    values: [
      { '@value': '10', '@type': `${XSD}integer` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}maxLength`,
      constraintLabel: 'Max Length',
      value: [{ chosenValue: '10', label: '10' }],
    },
    control: new FormControl('10')
  },
  {
    testName: 'sh:pattern',
    key: `${SH}pattern`,
    values: [
      { '@value': '^[a-zA-Z0-9]+$', '@type': `${XSD}string` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}pattern`,
      constraintLabel: 'Pattern',
      value: [{ chosenValue: '^[a-zA-Z0-9]+$', label: '^[a-zA-Z0-9]+$' }],
    },
    control: new FormControl('^[a-zA-Z0-9]+$')
  },
  {
    testName: 'sh:flags',
    key: `${SH}flags`,
    values: [
      { '@value': 'i', '@type': `${XSD}string` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}flags`,
      constraintLabel: 'Flags',
      value: [{ chosenValue: 'i', label: 'i' }],
    },
    control: new FormControl(['i'])
  },
  {
    testName: 'sh:languageIn',
    key: `${SH}languageIn`,
    values: [
      { '@id': '_:b1_lang' }
    ],
    bnodes: [
      { '@id': '_:b1_lang', [`${RDF}first`]: [{ '@value': 'en' }], [`${RDF}rest`]: [{ '@id': '_:b2_lang' }] },
      { '@id': '_:b2_lang', [`${RDF}first`]: [{ '@value': 'fr' }], [`${RDF}rest`]: [{ '@id': `${RDF}nil` }] },
    ],
    constraint: {
      constraintProp: `${SH}languageIn`,
      constraintLabel: 'Language In',
      value: [
        { chosenValue: 'en', label: 'en' },
        { chosenValue: 'fr', label: 'fr' }
      ],
    },
    control: new FormControl(['en', 'fr'])
  },
  {
    testName: 'sh:uniqueLang',
    key: `${SH}uniqueLang`,
    values: [
      { '@value': 'true', '@type': `${XSD}boolean` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}uniqueLang`,
      constraintLabel: 'Unique Lang',
      value: [{ chosenValue: 'true', label: 'true' }],
    },
    control: new FormControl('true')
  },
  {
    testName: 'sh:equals',
    key: `${SH}equals`,
    values: [
      { '@id': 'http://www.test.com/test#PropA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}equals`,
      constraintLabel: 'Equals',
      value: [{ chosenValue: 'http://www.test.com/test#PropA', label: 'Prop A' }],
    },
    control: new FormControl([{ label: 'Prop A', value: 'http://www.test.com/test#PropA' }])
  },
  {
    testName: 'sh:disjoint',
    key: `${SH}disjoint`,
    values: [
      { '@id': 'http://www.test.com/test#PropA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}disjoint`,
      constraintLabel: 'Disjoint',
      value: [{ chosenValue: 'http://www.test.com/test#PropA', label: 'Prop A' }],
    },
    control: new FormControl([{ label: 'Prop A', value: 'http://www.test.com/test#PropA' }])
  },
  {
    testName: 'sh:lessThan',
    key: `${SH}lessThan`,
    values: [
      { '@id': 'http://www.test.com/test#PropA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}lessThan`,
      constraintLabel: 'Less Than',
      value: [{ chosenValue: 'http://www.test.com/test#PropA', label: 'Prop A' }],
    },
    control: new FormControl({ label: 'Prop A', value: 'http://www.test.com/test#PropA' })
  },
  {
    testName: 'sh:lessThanOrEquals',
    key: `${SH}lessThanOrEquals`,
    values: [
      { '@id': 'http://www.test.com/test#PropA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}lessThanOrEquals`,
      constraintLabel: 'Less Than Or Equals',
      value: [{ chosenValue: 'http://www.test.com/test#PropA', label: 'Prop A' }],
    },
    control: new FormControl({ label: 'Prop A', value: 'http://www.test.com/test#PropA' })
  },
  // These test cases have to be done separate as they reuse the same property
  {
    testName: 'sh:hasValue with data value',
    separate: true,
    key: `${SH}hasValue`,
    values: [
      { '@value': '3.14', '@type': `${XSD}double` }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}hasValue`,
      constraintLabel: 'Has Value',
      value: [{ chosenValue: '3.14', label: '3.14' }],
    },
    control: new FormControl('3.14')
  },
  {
    testName: 'sh:hasValue with IRI value',
    separate: true,
    key: `${SH}hasValue`,
    values: [
      { '@id': 'http://www.test.com/test#IndividualA' }
    ],
    bnodes: [],
    constraint: {
      constraintProp: `${SH}hasValue`,
      constraintLabel: 'Has Value',
      value: [{ chosenValue: 'http://www.test.com/test#IndividualA', label: 'Individual A' }],
    },
    control: new FormControl({ label: 'Individual A', value: 'http://www.test.com/test#IndividualA' })
  },
  {
    testName: 'sh:in with data values',
    separate: true,
    key: `${SH}in`,
    values: [
      { '@id': '_:b1_in' }
    ],
    bnodes: [
      { '@id': '_:b1_in', [`${RDF}first`]: [{ '@value': '3.14', '@type': `${XSD}double` }], [`${RDF}rest`]: [{ '@id': '_:b2_in' }] },
      { '@id': '_:b2_in', [`${RDF}first`]: [{ '@value': '2.71', '@type': `${XSD}double` }], [`${RDF}rest`]: [{ '@id': `${RDF}nil` }] },
    ],
    constraint: {
      constraintProp: `${SH}in`,
      constraintLabel: 'In',
      value: [
        { chosenValue: '3.14', label: '3.14' },
        { chosenValue: '2.71', label: '2.71' }
      ],
    },
    control: new FormControl(['3.14', '2.71'])
  },
  {
    testName: 'sh:in with IRI values',
    separate: true,
    key: `${SH}in`,
    values: [
      { '@id': '_:b1_in_iri' }
    ],
    bnodes: [
      { '@id': '_:b1_in_iri', [`${RDF}first`]: [{ '@id': 'http://www.test.com/test#IndividualA' }], [`${RDF}rest`]: [{ '@id': '_:b2_in_iri' }] },
      { '@id': '_:b2_in_iri', [`${RDF}first`]: [{ '@id': 'http://www.test.com/test#IndividualB' }], [`${RDF}rest`]: [{ '@id': `${RDF}nil` }] },
    ],
    constraint: {
      constraintProp: `${SH}in`,
      constraintLabel: 'In',
      value: [
        { chosenValue: 'http://www.test.com/test#IndividualA', label: 'Individual A' },
        { chosenValue: 'http://www.test.com/test#IndividualB', label: 'Individual B' },
      ],
    },
    control: new FormControl([
      { label: 'Individual A', value: 'http://www.test.com/test#IndividualA' },
      { label: 'Individual B', value: 'http://www.test.com/test#IndividualB' }
    ])
  }
];
