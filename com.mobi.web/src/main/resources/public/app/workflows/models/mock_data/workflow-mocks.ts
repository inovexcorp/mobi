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
import { WorkflowSchema } from '../workflow-record.interface';
import { WorkflowDataRow } from '../workflow-record-table';
import { condenseCommitId } from '../../../shared/utility';
import moment from 'moment';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

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

const workflowRecordJSONLD:JSONLDObject[] =  [{
    '@id': 'https://mobi.com/records#5a1591d2-e5c5-4a30-bd8d-7b4b454d6c01',
    '@type': [
        'http://www.w3.org/2002/07/owl#Thing',
        'http://mobi.solutions/ontologies/workflows#WorkflowRecord',
        'http://mobi.com/ontologies/catalog#VersionedRecord',
        'http://mobi.com/ontologies/catalog#VersionedRDFRecord', 'http://mobi.com/ontologies/catalog#Record'
    ],
    'http://mobi.com/ontologies/catalog#branch': [ {
        '@id': 'https://mobi.com/branches#94c3573a-012d-4104-8c75-2a7ed15dca15'
    } ],
    'http://mobi.com/ontologies/catalog#catalog': [ {
        '@id': 'http://mobi.com/catalog-local'
    } ],
    'http://mobi.com/ontologies/catalog#masterBranch': [ {
        '@id': 'https://mobi.com/branches#94c3573a-012d-4104-8c75-2a7ed15dca15'
    } ],
    'http://mobi.solutions/ontologies/workflows#active': [ {
        '@type': 'http://www.w3.org/2001/XMLSchema#boolean',
        '@value': 'true'
    } ],
    'http://mobi.solutions/ontologies/workflows#workflowIRI': [ {
        '@id': 'http://example.com/workflows/100'
    } ],
    'http://purl.org/dc/terms/issued': [ {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
        '@value': '2024-03-04T12:07:50.819659-06:00'
    } ],
    'http://purl.org/dc/terms/modified': [ {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
        '@value': '2024-03-15T16:42:49.433528-05:00'
    } ],
    'http://purl.org/dc/terms/publisher': [ {
        '@id': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997'
    } ],
    'http://purl.org/dc/terms/title': [ {
        '@value': 'Workflow 100'
    } ]
}];

export { workflowRecordJSONLD };

const workflowRDF: JSONLDObject[] = [
    {
        '@id': 'http://example.com/workflows/LEDControl',
        '@type': [
            'http://mobi.solutions/ontologies/workflows#Workflow'
        ],
        'http://mobi.solutions/ontologies/workflows#hasAction': [
            {
                '@id': 'http://example.com/workflows/LEDControl/action'
            },
            {
                '@id': 'http://example.com/workflows/LEDControl/action/b'
            }
        ],
        'http://mobi.solutions/ontologies/workflows#hasTrigger': [
            {
                '@id': 'http://example.com/workflows/LEDControl/trigger'
            }
        ],
        'http://purl.org/dc/terms/description': [
            {
                '@value': 'This is Workflow Daily LED Control.'
            }
        ],
        'http://purl.org/dc/terms/title': [
            {
                '@value': 'Workflow Daily LED Control'
            }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/action',
        '@type': [
            'http://mobi.solutions/ontologies/workflows#Action',
            'http://mobi.solutions/ontologies/workflows#TestAction'
        ],
        'http://mobi.solutions/ontologies/workflows#testMessage': [
            {
                '@value': 'This is a test message from Workflow C'
            }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/action/b',
        '@type': [
            'http://mobi.solutions/ontologies/workflows#Action',
            'http://mobi.solutions/ontologies/workflows#TestAction'
        ],
        'http://mobi.solutions/ontologies/workflows#testMessage': [
            {
                '@value': 'Lights On'
            }
        ]
    },
    {
        '@id': 'http://example.com/workflows/LEDControl/trigger',
        '@type': [
            'http://mobi.solutions/ontologies/workflows#Trigger',
            'http://mobi.solutions/ontologies/workflows#ScheduledTrigger'
        ],
        'http://mobi.solutions/ontologies/workflows#cron': [
            {
                '@value': '1 0/1 * 1/1 * ? *'
            }
        ]
    }
];
export { workflowRDF };