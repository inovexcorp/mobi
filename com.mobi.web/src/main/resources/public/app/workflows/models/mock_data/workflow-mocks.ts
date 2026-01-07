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
import moment from 'moment';

import { WorkflowSchema } from '../workflow-record.interface';
import { WorkflowDataRow } from '../workflow-record-table';
import { condenseCommitId } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CATALOG, DCTERMS, OWL, RDFS, SH, SHACL_FORM, WORKFLOWS, XSD } from '../../../prefixes';

const workflow_mocks: WorkflowSchema[] = [
    {
        iri: 'https://mobi.com/records#87ecd33d-c5c4-441a-9d8c-33151bc32952',
        title: 'PipeDreamHarmony',
        issued: new Date('2024-02-22T15:45:44.042837-06:00'),
        modified: new Date('2024-02-22T15:47:36.022949-06:00'),
        description: 'PipeDreamHarmony description',
        active: true,
        workflowIRI: 'http://example.com/workflows/PipeDreamHarmony',
        master: 'https://mobi.com/branches#5ce0a198-875a-4b3c-84f7-9dc2ca318197',
        executionId: 'http://mobi.com/activities/5d22e258-03d7-4289-87c0-49396a67929f',
        executorIri: 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
        executorUsername: 'admin',
        executorDisplayName: 'admin',
        startTime: new Date('2024-02-22T15:48:20.047142-06:00'),
        endTime: new Date('2024-02-22T15:48:30.137812-06:00'),
        status: 'success',
        canModifyMasterBranch: false,
        canDeleteWorkflow: false,
      },
    {
        iri: 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
        title: 'Workflow 1',
        issued: new Date('2024-02-22T09:58:28.893984-06:00'),
        modified: new Date('2024-02-22T09:58:28.91432-06:00'),
        description: 'Workflow 1 description',
        active: false,
        workflowIRI: 'http://example.com/workflows/1',
        master: 'https://mobi.com/branches#5ce0a198-875a-4b3c-84f7-9dc2ca318198',
        executionId: null,
        executorIri: null,
        executorUsername: null,
        executorDisplayName: null,
        startTime: null,
        endTime: null,
        status: null,
        canModifyMasterBranch: true,
        canDeleteWorkflow: true,
      }
];

export { workflow_mocks };

const workflow_data_row_mocks: WorkflowDataRow[] =
    [
        {
            record: workflow_mocks[0],
            statusDisplay: 'success',
            executorDisplay: 'admin',
            executionIdDisplay: condenseCommitId('5d22e258-03d7-4289-87c0-49396a67929f'),
            startTimeDisplay: moment(new Date('2024-02-22T15:48:20.047142-06:00')).format('h:mm:ssA M/D/Y'),
            runningTimeDisplay: '10.09 sec'
        },
        {   
            record: workflow_mocks[1],
            statusDisplay: '(none)',
            executorDisplay: '(none)',
            executionIdDisplay: '(none)',
            startTimeDisplay: '(none)',
            runningTimeDisplay: '(none)'
        }
    ];

export { workflow_data_row_mocks };

const workflowRecordJSONLD: JSONLDObject[] =  [{
    '@id': 'https://mobi.com/records#5a1591d2-e5c5-4a30-bd8d-7b4b454d6c01',
    '@type': [
        `${OWL}Thing`,
        `${WORKFLOWS}WorkflowRecord`,
        `${CATALOG}VersionedRecord`,
        `${CATALOG}VersionedRDFRecord`, `${CATALOG}Record`
    ],
    [`${CATALOG}branch`]: [ {
        '@id': 'https://mobi.com/branches#94c3573a-012d-4104-8c75-2a7ed15dca15'
    } ],
    [`${CATALOG}catalog`]: [ {
        '@id': 'http://mobi.com/catalog-local'
    } ],
    [`${CATALOG}masterBranch`]: [ {
        '@id': 'https://mobi.com/branches#94c3573a-012d-4104-8c75-2a7ed15dca15'
    } ],
    [`${WORKFLOWS}active`]: [ {
        '@type': `${XSD}boolean`,
        '@value': 'true'
    } ],
    [`${WORKFLOWS}workflowIRI`]: [ {
        '@id': 'http://example.com/workflows/100'
    } ],
    [`${DCTERMS}issued`]: [ {
        '@type': `${XSD}dateTime`,
        '@value': '2024-03-04T12:07:50.819659-06:00'
    } ],
    [`${DCTERMS}modified`]: [ {
        '@type': `${XSD}dateTime`,
        '@value': '2024-03-15T16:42:49.433528-05:00'
    } ],
    [`${DCTERMS}publisher`]: [ {
        '@id': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997'
    } ],
    [`${DCTERMS}title`]: [ {
        '@value': 'Workflow 100'
    } ]
}];

export { workflowRecordJSONLD };

// TODO: Consider making this more complex now that chained actions are supported
const workflowRDF: JSONLDObject[] = [
    {
        '@id': 'http://example.com/workflows/LEDControl',
        '@type': [
            `${WORKFLOWS}Workflow`
        ],
        [`${WORKFLOWS}hasAction`]: [
            {
                '@id': 'http://example.com/workflows/LEDControl/action'
            },
            {
                '@id': 'http://example.com/workflows/LEDControl/action/b'
            }
        ],
        [`${WORKFLOWS}hasTrigger`]: [
            {
                '@id': 'http://example.com/workflows/LEDControl/trigger'
            }
        ],
        [`${DCTERMS}description`]: [
            {
                '@value': 'This is Workflow Daily LED Control.'
            }
        ],
        [`${DCTERMS}title`]: [
            {
                '@value': 'Workflow Daily LED Control'
            }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/action',
        '@type': [
            `${WORKFLOWS}Action`,
            `${WORKFLOWS}TestAction`
        ],
        [`${WORKFLOWS}testMessage`]: [
            {
                '@value': 'This is a test message from action in Workflow C'
            }
        ],
        [`${WORKFLOWS}hasChildAction`]: [
            {
              '@id': 'http://example.com/workflows/LEDControl/action/a'
            }
        ],
        [`${DCTERMS}title`]: [
          {
              '@value': 'New Title'
          }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/action/a',
        '@type': [
            `${WORKFLOWS}Action`,
            `${WORKFLOWS}TestAction`
        ],
        [`${WORKFLOWS}testMessage`]: [
            {
                '@value': 'This is a test message from action A in Workflow C'
            }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/action/b',
        '@type': [
            `${WORKFLOWS}Action`,
            `${WORKFLOWS}HTTPRequestAction`
        ],
        [`${WORKFLOWS}hasHttpUrl`]: [
            {
                '@value': 'http://test.com'
            }
        ],
        [`${WORKFLOWS}hasHeader`]: [
          {
              '@id': 'http://example.com/workflows/LEDControl/header'
          }
      ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/header',
        '@type': [`${WORKFLOWS}Header`],
        [`${WORKFLOWS}hasHeaderName`]: [
            {
                '@value': 'X-Test'
            }
        ],
        [`${WORKFLOWS}hasHeaderValue`]: [
          {
              '@value': 'Test Value'
          }
      ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/trigger',
        '@type': [
            `${WORKFLOWS}Trigger`,
            `${WORKFLOWS}ScheduledTrigger`
        ],
        [`${WORKFLOWS}cron`]: [
            {
                '@value': '1 0/1 * 1/1 * ? *'
            }
        ]
    }
];
export { workflowRDF };

const testActionNodeShape: JSONLDObject = {
  '@id': `${WORKFLOWS}TestAction`,
  '@type': [
      `${OWL}Class`,
      `${SH}NodeShape`,
      `${RDFS}Class`
  ],
  [`${RDFS}comment`]: [
      {
          '@language': 'en',
          '@value': 'An action that simply outputs the provided message.'
      }
  ],
  [`${RDFS}label`]: [
      {
          '@language': 'en',
          '@value': 'Test Action'
      }
  ],
  [`${RDFS}subClassOf`]: [
      {
          '@id': `${WORKFLOWS}Action`
      }
  ],
  [`${SH}property`]: [
      {
          '@id': `${WORKFLOWS}testActionPropertyShape`
      }
  ]
};
export { testActionNodeShape };

const httpRequestActionNodeShape: JSONLDObject = {
    '@id': `${WORKFLOWS}HTTPRequestAction`,
    '@type': [
        `${OWL}Class`,
        `${SH}NodeShape`,
        `${RDFS}Class`
    ],
    [`${RDFS}label`]: [
        {
            '@language': 'en',
            '@value': 'HTTP Request Action'
        }
    ],
    [`${RDFS}subClassOf`]: [
        {
            '@id': `${WORKFLOWS}Action`
        }
    ],
    [`${SH}property`]: [
        {
            '@id': `${WORKFLOWS}httpUrlPropertyShape`
        },
        {
            '@id': `${WORKFLOWS}httpHeaderPropertyShape`
        }
    ]
};
export { httpRequestActionNodeShape };

const actionSHACLDefinitions = {
    [testActionNodeShape['@id']]: [
        {
            '@id': `${WORKFLOWS}Action`,
            '@type': [
                `${OWL}Class`
            ],
            [`${RDFS}comment`]: [
                {
                    '@language': 'en',
                    '@value': 'A set of instructions that should be executed when a Workflow is running.'
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'Action'
                }
            ]
        },
        testActionNodeShape,
        {
            '@id': `${WORKFLOWS}testActionPropertyShape`,
            '@type': [
                `${SH}PropertyShape`
            ],
            [`${SH}datatype`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}maxCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}minCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}path`]: [
                {
                    '@id': `${WORKFLOWS}testMessage`
                }
            ],
            [`${SHACL_FORM}usesFormField`]: [
                {
                    '@id': `${SHACL_FORM}TextInput`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}testMessage`,
            '@type': [
                `${OWL}DatatypeProperty`,
                `${OWL}FunctionalProperty`
            ],
            [`${RDFS}comment`]: [
                {
                    '@language': 'en',
                    '@value': 'A message for a Test Action to output.'
                }
            ],
            [`${RDFS}domain`]: [
                {
                    '@id': `${WORKFLOWS}TestAction`
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'test message'
                }
            ],
            [`${RDFS}range`]: [
                {
                    '@id': `${XSD}string`
                }
            ]
        }
    ],
    [httpRequestActionNodeShape['@id']]: [
        httpRequestActionNodeShape,
        {
            '@id': `${WORKFLOWS}Header`,
            '@type': [
                `${OWL}Class`,
                `${SH}NodeShape`,
                `${RDFS}Class`
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'Header'
                }
            ],
            [`${SH}property`]: [
                {
                    '@id': `${WORKFLOWS}headerNamePropertyShape`
                },
                {
                    '@id': `${WORKFLOWS}headerValuePropertyShape`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}hasHeader`,
            '@type': [
                `${OWL}ObjectProperty`
            ],
            [`${RDFS}domain`]: [
                {
                    '@id': `${WORKFLOWS}HTTPRequestAction`
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@value': 'hasHeader'
                }
            ],
            [`${RDFS}range`]: [
                {
                    '@id': `${WORKFLOWS}Header`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}hasHeaderName`,
            '@type': [
                `${OWL}DatatypeProperty`,
                `${OWL}FunctionalProperty`
            ],
            [`${RDFS}comment`]: [
                {
                    '@language': 'en',
                    '@value': 'The Key/Name of the Header'
                }
            ],
            [`${RDFS}domain`]: [
                {
                    '@id': `${WORKFLOWS}Header`
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'header name'
                }
            ],
            [`${RDFS}range`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}order`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '0'
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}hasHeaderValue`,
            '@type': [
                `${OWL}DatatypeProperty`,
                `${OWL}FunctionalProperty`
            ],
            [`${RDFS}comment`]: [
                {
                    '@language': 'en',
                    '@value': 'The Value of the Header'
                }
            ],
            [`${RDFS}domain`]: [
                {
                    '@id': `${WORKFLOWS}Header`
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'header value'
                }
            ],
            [`${RDFS}range`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}order`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}hasHttpUrl`,
            '@type': [
                `${OWL}DatatypeProperty`,
                `${OWL}FunctionalProperty`
            ],
            [`${RDFS}comment`]: [
                {
                    '@language': 'en',
                    '@value': 'The URL of the HTTP request'
                }
            ],
            [`${RDFS}domain`]: [
                {
                    '@id': `${WORKFLOWS}HTTPRequestAction`
                }
            ],
            [`${RDFS}label`]: [
                {
                    '@language': 'en',
                    '@value': 'http url'
                }
            ],
            [`${RDFS}range`]: [
                {
                    '@id': `${XSD}string`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}headerNamePropertyShape`,
            '@type': [
                `${SH}PropertyShape`
            ],
            [`${SH}datatype`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}maxCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}minCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}name`]: [
                {
                    '@value': 'Header Name'
                }
            ],
            [`${SH}path`]: [
                {
                    '@id': `${WORKFLOWS}hasHeaderName`
                }
            ],
            [`${SHACL_FORM}usesFormField`]: [
                {
                    '@id': `${SHACL_FORM}TextInput`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}headerValuePropertyShape`,
            '@type': [
                `${SH}PropertyShape`
            ],
            [`${SH}datatype`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}maxCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}minCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}name`]: [
                {
                    '@value': 'Header Value'
                }
            ],
            [`${SH}path`]: [
                {
                    '@id': `${WORKFLOWS}hasHeaderValue`
                }
            ],
            [`${SHACL_FORM}usesFormField`]: [
                {
                    '@id': `${SHACL_FORM}TextInput`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}httpHeaderPropertyShape`,
            '@type': [
                `${SH}PropertyShape`
            ],
            [`${SH}minCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '0'
                }
            ],
            [`${SH}node`]: [
                {
                    '@id': `${WORKFLOWS}Header`
                }
            ],
            [`${SH}path`]: [
                {
                    '@id': `${WORKFLOWS}hasHeader`
                }
            ]
        },
        {
            '@id': `${WORKFLOWS}httpUrlPropertyShape`,
            '@type': [
                `${SH}PropertyShape`
            ],
            [`${SH}datatype`]: [
                {
                    '@id': `${XSD}string`
                }
            ],
            [`${SH}maxCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}minCount`]: [
                {
                    '@type': `${XSD}integer`,
                    '@value': '1'
                }
            ],
            [`${SH}path`]: [
                {
                    '@id': `${WORKFLOWS}hasHttpUrl`
                }
            ],
            [`${SH}pattern`]: [
                {
                    '@value': '^(https?|ftp):\\/\\/[^\\s\\/$.?#].[^\\s]*$'
                }
            ],
            [`${SHACL_FORM}usesFormField`]: [
                {
                    '@id': `${SHACL_FORM}TextInput`
                }
            ]
        }
    ]
};
export { actionSHACLDefinitions };

const scheduledTriggerNodeShape: JSONLDObject = {
    '@id': `${WORKFLOWS}ScheduledTrigger`,
    '@type': [
        `${OWL}Class`,
        `${SH}NodeShape`,
        `${RDFS}Class`
    ],
    [`${RDFS}comment`]: [
        {
            '@language': 'en',
            '@value': 'A specification for executing a Workflow on a specified schedule.'
        }
    ],
    [`${RDFS}label`]: [
        {
            '@language': 'en',
            '@value': 'Scheduled Trigger'
        }
    ],
    [`${RDFS}subClassOf`]: [
        {
            '@id': `${WORKFLOWS}Trigger`
        }
    ],
    [`${SH}property`]: [
        {
            '@id': `${WORKFLOWS}cronExpressionPropertyShape`
        }
    ]
};
export { scheduledTriggerNodeShape };

const commitToBranchTriggerNodeShape: JSONLDObject = {
    '@id': `${WORKFLOWS}CommitToBranchTrigger`,
    '@type': [
        `${OWL}Class`,
        `${SH}NodeShape`,
        `${RDFS}Class`
    ],
    [`${RDFS}comment`]: [
        {
            '@language': 'en',
            '@value': 'A specification for executing a Workflow when a Commit is made on a specified Branch of a specific Record.'
        }
    ],
    [`${RDFS}label`]: [
        {
            '@language': 'en',
            '@value': 'Commit to Branch Trigger'
        }
    ],
    [`${RDFS}subClassOf`]: [
        {
            '@id': `${WORKFLOWS}EventTrigger`
        }
    ],
    [`${SH}property`]: [
        {
            '@id': `${WORKFLOWS}watchesRecordPropertyShape`
        },
        {
            '@id': `${WORKFLOWS}watchesBranchPropertyShape`
        }
    ]
};
export { commitToBranchTriggerNodeShape };

const triggerSHACLDefinitions = {
    [commitToBranchTriggerNodeShape['@id']]: [
        {
            '@id': '_:02f15581c487430599f07bb6b91688ad8933',
            '@type': [
                `${SH}SPARQLConstraint`
            ]
        },
        commitToBranchTriggerNodeShape,
        {
          '@id': `${WORKFLOWS}watchesBranch`,
          '@type': [
              `${OWL}ObjectProperty`,
              `${OWL}FunctionalProperty`
          ],
          [`${RDFS}comment`]: [
              {
                  '@language': 'en',
                  '@value': 'The Branch to watch for Commit activity.'
              }
          ],
          [`${RDFS}domain`]: [
              {
                  '@id': `${WORKFLOWS}CommitToBranchTrigger`
              }
          ],
          [`${RDFS}label`]: [
              {
                  '@language': 'en',
                  '@value': 'watches Branch'
              }
          ],
          [`${RDFS}range`]: [
              {
                  '@id': `${CATALOG}Branch`
              }
          ]
      },
      {
          '@id': `${WORKFLOWS}watchesBranchPropertyShape`,
          '@type': [
              `${SH}PropertyShape`
          ],
          [`${SH}class`]: [
              {
                  '@id': `${CATALOG}Branch`
              }
          ],
          [`${SH}maxCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}minCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}path`]: [
              {
                  '@id': `${WORKFLOWS}watchesBranch`
              }
          ],
          [`${SH}sparql`]: [
              {
                  '@id': '_:02f15581c487430599f07bb6b91688ad8933'
              }
          ],
          [`${SHACL_FORM}usesFormField`]: [
              {
                  '@id': `${SHACL_FORM}AutocompleteInput`
              }
          ]
      },
      {
          '@id': `${WORKFLOWS}watchesRecord`,
          '@type': [
              `${OWL}ObjectProperty`,
              `${OWL}FunctionalProperty`
          ],
          [`${RDFS}comment`]: [
              {
                  '@language': 'en',
                  '@value': 'The VersionedRdfRecord with the Branch to watch for Commit activity.'
              }
          ],
          [`${RDFS}domain`]: [
              {
                  '@id': `${WORKFLOWS}CommitToBranchTrigger`
              }
          ],
          [`${RDFS}label`]: [
              {
                  '@language': 'en',
                  '@value': 'watches Record'
              }
          ],
          [`${RDFS}range`]: [
              {
                  '@id': `${CATALOG}VersionedRdfRecord`
              }
          ]
      },
      {
          '@id': `${WORKFLOWS}watchesRecordPropertyShape`,
          '@type': [
              `${SH}PropertyShape`
          ],
          [`${SH}class`]: [
              {
                  '@id': `${CATALOG}VersionedRDFRecord`
              }
          ],
          [`${SH}maxCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}minCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}path`]: [
              {
                  '@id': `${WORKFLOWS}watchesRecord`
              }
          ],
          [`${SHACL_FORM}usesFormField`]: [
              {
                  '@id': `${SHACL_FORM}AutocompleteInput`
              }
          ]
        }
    ],
    [scheduledTriggerNodeShape['@id']]: [
      scheduledTriggerNodeShape,
      {
          '@id': `${WORKFLOWS}cron`,
          '@type': [
              `${OWL}DatatypeProperty`,
              `${OWL}FunctionalProperty`
          ],
          [`${RDFS}comment`]: [
              {
                  '@language': 'en',
                  '@value': 'A cron expression that dictates when the ScheduledTrigger should kick off a Workflow.'
              }
          ],
          [`${RDFS}domain`]: [
              {
                  '@id': `${WORKFLOWS}ScheduledTrigger`
              }
          ],
          [`${RDFS}label`]: [
              {
                  '@language': 'en',
                  '@value': 'cron'
              }
          ],
          [`${RDFS}range`]: [
              {
                  '@id': `${XSD}string`
              }
          ]
      },
      {
          '@id': `${WORKFLOWS}cronExpressionPropertyShape`,
          '@type': [
              `${SH}PropertyShape`
          ],
          [`${SH}datatype`]: [
              {
                  '@id': `${XSD}string`
              }
          ],
          [`${SH}maxCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}minCount`]: [
              {
                  '@type': `${XSD}integer`,
                  '@value': '1'
              }
          ],
          [`${SH}path`]: [
              {
                  '@id': `${WORKFLOWS}cron`
              }
          ],
          [`${SH}pattern`]: [
              {
                  '@value': '(((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*|\\?) ?){5,7}'
              }
          ],
          [`${SHACL_FORM}usesFormField`]: [
              {
                  '@id': `${SHACL_FORM}TextInput`
              }
          ]
      }
    ]
};
export { triggerSHACLDefinitions };
