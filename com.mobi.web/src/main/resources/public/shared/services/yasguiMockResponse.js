/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

export default function yasguiMockResponse() {
    return {
    "req": {
      "method": "GET",
      "url": "https://localhost:8443/mobirest/sparql/limited-results?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0ASELECT%20*%20WHERE%20%7B%0A%20%20%3Fsub%20%3Fpred%20%3Fobj%20.%0A%7D%20LIMIT%2010",
      "headers": {
        "accept": "application/json"
      }
    },
    "xhr": {
      "__zone_symbol__readystatechangefalse": [
        {
          "type": "eventTask",
          "state": "scheduled",
          "source": "XMLHttpRequest.addEventListener:readystatechange",
          "zone": "angular",
          "runCount": 8
        }
      ],
      "__zone_symbol__xhrSync": false,
      "__zone_symbol__xhrURL": "https://localhost:8443/mobirest/sparql/limited-results?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0ASELECT%20*%20WHERE%20%7B%0A%20%20%3Fsub%20%3Fpred%20%3Fobj%20.%0A%7D%20LIMIT%2010",
      "__zone_symbol__xhrScheduled": true,
      "__zone_symbol__xhrErrorBeforeScheduled": false,
      "__zone_symbol__xhrTask": {
        "type": "macroTask",
        "state": "notScheduled",
        "source": "XMLHttpRequest.send",
        "zone": "angular",
        "runCount": 0
      }
    },
    "text": "{\n  \"head\" : {\n    \"vars\" : [\n      \"sub\",\n      \"pred\",\n      \"obj\"\n    ]\n  },\n  \"results\" : {\n    \"bindings\" : [\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Ontology Editor\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/platform/config#Application\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The built-in Ontology Editor application in Mobi.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Mapping Tool\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/platform/config#Application\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The built-in Mapping Tool application in Mobi.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"SPARQL Editor\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      }\n    ]\n  }\n}",
    "statusText": "OK",
    "statusCode": 200,
    "status": 200,
    "statusType": 2,
    "info": false,
    "ok": true,
    "redirect": false,
    "clientError": false,
    "serverError": false,
    "error": false,
    "created": false,
    "accepted": false,
    "noContent": false,
    "badRequest": false,
    "unauthorized": false,
    "notAcceptable": false,
    "forbidden": false,
    "notFound": false,
    "unprocessableEntity": false,
    "headers": {
      "content-encoding": "gzip",
      "content-length": "403",
      "content-type": "application/json",
      "date": "Tue, 14 Jul 2020 04:14:18 GMT",
      "server": "Jetty(9.4.6.v20170531)"
    },
    "header": {
      "content-encoding": "gzip",
      "content-length": "403",
      "content-type": "application/json",
      "date": "Tue, 14 Jul 2020 04:14:18 GMT",
      "server": "Jetty(9.4.6.v20170531)"
    },
    "type": "application/json",
    "links": {
      
    },
    "body": {
      "head": {
        "vars": [
          "sub",
          "pred",
          "obj"
        ]
      },
      "results": {
        "bindings": [
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#ontology-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title"
            },
            "obj": {
              "type": "literal",
              "value": "Ontology Editor"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#ontology-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            "obj": {
              "type": "uri",
              "value": "http://www.w3.org/2002/07/owl#Thing"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#ontology-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            "obj": {
              "type": "uri",
              "value": "http://mobi.com/ontologies/platform/config#Application"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#ontology-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/description"
            },
            "obj": {
              "type": "literal",
              "value": "The built-in Ontology Editor application in Mobi."
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#mapping-tool"
            },
            "pred": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title"
            },
            "obj": {
              "type": "literal",
              "value": "Mapping Tool"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#mapping-tool"
            },
            "pred": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            "obj": {
              "type": "uri",
              "value": "http://www.w3.org/2002/07/owl#Thing"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#mapping-tool"
            },
            "pred": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            "obj": {
              "type": "uri",
              "value": "http://mobi.com/ontologies/platform/config#Application"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#mapping-tool"
            },
            "pred": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/description"
            },
            "obj": {
              "type": "literal",
              "value": "The built-in Mapping Tool application in Mobi."
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#sparql-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title"
            },
            "obj": {
              "type": "literal",
              "value": "SPARQL Editor"
            }
          },
          {
            "sub": {
              "type": "uri",
              "value": "http://mobi.com/applications#sparql-editor"
            },
            "pred": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            "obj": {
              "type": "uri",
              "value": "http://www.w3.org/2002/07/owl#Thing"
            }
          }
        ]
      }
    }
  };
}