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


export function yasguiMockResponse() {
    return {
      "req": {
        "method": "GET",
        "url": "https://localhost:8443/mobirest/sparql/limited-results?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aselect%20*%20WHERE%20%7B%0A%20%20%3Fsub%20%3Fpred%20%3Fobj%20.%0A%7D",
        "headers": {
          "accept": "text/turtle"
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
        "__zone_symbol__xhrURL": "https://localhost:8443/mobirest/sparql/limited-results?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aselect%20*%20WHERE%20%7B%0A%20%20%3Fsub%20%3Fpred%20%3Fobj%20.%0A%7D",
        "__zone_symbol__xhrScheduled": true,
        "__zone_symbol__xhrErrorBeforeScheduled": false,
        "__zone_symbol__xhrTask": {
          "type": "macroTask",
          "state": "scheduled",
          "source": "XMLHttpRequest.send",
          "zone": "angular",
          "runCount": 0
        }
      },
      "text": "{\n  \"head\" : {\n    \"vars\" : [\n      \"sub\",\n      \"pred\",\n      \"obj\"\n    ]\n  },\n  \"results\" : {\n    \"bindings\" : [\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Mapping Tool\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/platform/config#Application\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#mapping-tool\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The built-in Mapping Tool application in Mobi.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"SPARQL Editor\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/platform/config#Application\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#sparql-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The built-in SPARQL Query Editor application in Mobi.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Ontology Editor\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/platform/config#Application\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/applications#ontology-editor\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The built-in Ontology Editor application in Mobi.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/admin\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"admin\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/admin\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#Role\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/admin\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/admin\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://xmlns.com/foaf/0.1/Agent\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/user\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"user\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/user\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#Role\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/user\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/user\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://xmlns.com/foaf/0.1/Agent\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://xmlns.com/foaf/0.1/Agent\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#User\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/ns/prov#Agent\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://xmlns.com/foaf/0.1/Person\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#hasUserRole\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/admin\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#hasUserRole\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/roles/user\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#password\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"{CRYPT}21232F297A57A5A743894A0E4A801FC3{CRYPT}\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/user/management#username\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"admin\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Mobi Catalog (Distributed)\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/catalog#Catalog\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/issued\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",\n          \"type\" : \"literal\",\n          \"value\" : \"2020-07-20T18:01:18.205-05:00\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-distributed\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/modified\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",\n          \"type\" : \"literal\",\n          \"value\" : \"2020-07-20T18:01:18.205-05:00\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/title\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"Mobi Catalog (Local)\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/catalog#Catalog\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/description\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/issued\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",\n          \"type\" : \"literal\",\n          \"value\" : \"2020-07-20T18:01:18.219-05:00\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://purl.org/dc/terms/modified\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",\n          \"type\" : \"literal\",\n          \"value\" : \"2020-07-20T18:01:18.219-05:00\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#BinaryFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#Policy\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#PolicyFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#checksum\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"\\\"L\\u0019�J)�9�����DYC�v��\\u0012ge.��\\u00174ڲ\\u001F\\u001D\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#fileName\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6.xml\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#retrievalURL\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#size\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#double\",\n          \"type\" : \"literal\",\n          \"value\" : \"10577.0\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#BinaryFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#Policy\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#PolicyFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#checksum\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"!\\t�\\u0019��\\u0000�Y�0.$(8�\\u0019c}VJܐYmȶ\\u0014�8\\u0000�\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#fileName\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780.xml\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#retrievalURL\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#size\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#double\",\n          \"type\" : \"literal\",\n          \"value\" : \"3429.0\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#relatedAction\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#Create\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/ontology-creation\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#relatedResource\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/catalog-local\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/2002/07/owl#Thing\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#BinaryFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#Policy\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#PolicyFile\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#checksum\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"f��\\u001D�0�^^|?��\\u001C-��C�\\u0017{ |n��d����\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#fileName\"\n        },\n        \"obj\" : {\n          \"type\" : \"literal\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1.xml\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#retrievalURL\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/documents#size\"\n        },\n        \"obj\" : {\n          \"datatype\" : \"http://www.w3.org/2001/XMLSchema#double\",\n          \"type\" : \"literal\",\n          \"value\" : \"2910.0\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#relatedAction\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#Read\"\n        }\n      },\n      {\n        \"sub\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/policies/system-repo-access\"\n        },\n        \"pred\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/ontologies/policy#relatedResource\"\n        },\n        \"obj\" : {\n          \"type\" : \"uri\",\n          \"value\" : \"http://mobi.com/system-repo\"\n        }\n      }\n    ]\n  }\n}",
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
        "content-length": "1505",
        "content-type": "application/json",
        "date": "Fri, 24 Jul 2020 23:02:59 GMT",
        "server": "Jetty(9.4.6.v20170531)"
      },
      "header": {
        "content-encoding": "gzip",
        "content-length": "1505",
        "content-type": "application/json",
        "date": "Fri, 24 Jul 2020 23:02:59 GMT",
        "server": "Jetty(9.4.6.v20170531)"
      },
      "type": "application/json",
      "links": {},
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
                "value": "http://mobi.com/ontologies/platform/config#Application"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/applications#sparql-editor"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/description"
              },
              "obj": {
                "type": "literal",
                "value": "The built-in SPARQL Query Editor application in Mobi."
              }
            },
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
                "value": "http://mobi.com/roles/admin"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/title"
              },
              "obj": {
                "type": "literal",
                "value": "admin"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/roles/admin"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#Role"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/roles/admin"
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
                "value": "http://mobi.com/roles/admin"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://xmlns.com/foaf/0.1/Agent"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/roles/user"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/title"
              },
              "obj": {
                "type": "literal",
                "value": "user"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/roles/user"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#Role"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/roles/user"
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
                "value": "http://mobi.com/roles/user"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://xmlns.com/foaf/0.1/Agent"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
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
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://xmlns.com/foaf/0.1/Agent"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#User"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://www.w3.org/ns/prov#Agent"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://xmlns.com/foaf/0.1/Person"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#hasUserRole"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/roles/admin"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#hasUserRole"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/roles/user"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#password"
              },
              "obj": {
                "type": "literal",
                "value": "{CRYPT}21232F297A57A5A743894A0E4A801FC3{CRYPT}"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/user/management#username"
              },
              "obj": {
                "type": "literal",
                "value": "admin"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-distributed"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/title"
              },
              "obj": {
                "type": "literal",
                "value": "Mobi Catalog (Distributed)"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-distributed"
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
                "value": "http://mobi.com/catalog-distributed"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/catalog#Catalog"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-distributed"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/description"
              },
              "obj": {
                "type": "literal",
                "value": "The Mobi Catalog records datasets, ontologies, data mappings, and other resources."
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-distributed"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/issued"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",
                "type": "literal",
                "value": "2020-07-20T18:01:18.205-05:00"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-distributed"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/modified"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",
                "type": "literal",
                "value": "2020-07-20T18:01:18.205-05:00"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/title"
              },
              "obj": {
                "type": "literal",
                "value": "Mobi Catalog (Local)"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
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
                "value": "http://mobi.com/catalog-local"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/catalog#Catalog"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/description"
              },
              "obj": {
                "type": "literal",
                "value": "The Mobi Catalog records datasets, ontologies, data mappings, and other resources."
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/issued"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",
                "type": "literal",
                "value": "2020-07-20T18:01:18.219-05:00"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
              },
              "pred": {
                "type": "uri",
                "value": "http://purl.org/dc/terms/modified"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",
                "type": "literal",
                "value": "2020-07-20T18:01:18.219-05:00"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
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
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#BinaryFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#Policy"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#PolicyFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#checksum"
              },
              "obj": {
                "type": "literal",
                "value": "\"L\u0019�J)�9�����DYC�v��\u0012ge.��\u00174ڲ\u001f\u001d"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#fileName"
              },
              "obj": {
                "type": "literal",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6.xml"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#retrievalURL"
              },
              "obj": {
                "type": "uri",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/all-access-versioned-rdf-record"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#size"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#double",
                "type": "literal",
                "value": "10577.0"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
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
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#BinaryFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#Policy"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#PolicyFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#checksum"
              },
              "obj": {
                "type": "literal",
                "value": "!\t�\u0019��\u0000�Y�0.$(8�\u0019c}VJܐYmȶ\u0014�8\u0000�"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#fileName"
              },
              "obj": {
                "type": "literal",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780.xml"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#retrievalURL"
              },
              "obj": {
                "type": "uri",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#size"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#double",
                "type": "literal",
                "value": "3429.0"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#relatedAction"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#Create"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/ontology-creation"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#relatedResource"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/catalog-local"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
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
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#BinaryFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#Policy"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#PolicyFile"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#checksum"
              },
              "obj": {
                "type": "literal",
                "value": "f��\u001d�0�^^|?��\u001c-��C�\u0017{ |n��d����"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#fileName"
              },
              "obj": {
                "type": "literal",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1.xml"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#retrievalURL"
              },
              "obj": {
                "type": "uri",
                "value": "file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/documents#size"
              },
              "obj": {
                "datatype": "http://www.w3.org/2001/XMLSchema#double",
                "type": "literal",
                "value": "2910.0"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#relatedAction"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#Read"
              }
            },
            {
              "sub": {
                "type": "uri",
                "value": "http://mobi.com/policies/system-repo-access"
              },
              "pred": {
                "type": "uri",
                "value": "http://mobi.com/ontologies/policy#relatedResource"
              },
              "obj": {
                "type": "uri",
                "value": "http://mobi.com/system-repo"
              }
            }
          ]
        }
      }
    }
}

export function turtleResponseText() {
  return {
    "text": "\n<http://mobi.com/applications#mapping-tool> a <http://mobi.com/ontologies/platform/config#Application>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://purl.org/dc/terms/description> \"The built-in Mapping Tool application in Mobi.\";\n  <http://purl.org/dc/terms/title> \"Mapping Tool\" .\n\n<http://mobi.com/applications#sparql-editor> a <http://mobi.com/ontologies/platform/config#Application>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://purl.org/dc/terms/description> \"The built-in SPARQL Query Editor application in Mobi.\";\n  <http://purl.org/dc/terms/title> \"SPARQL Editor\" .\n\n<http://mobi.com/applications#ontology-editor> a <http://mobi.com/ontologies/platform/config#Application>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://purl.org/dc/terms/description> \"The built-in Ontology Editor application in Mobi.\";\n  <http://purl.org/dc/terms/title> \"Ontology Editor\" .\n\n<http://mobi.com/roles/admin> a <http://mobi.com/ontologies/user/management#Role>,\n    <http://www.w3.org/2002/07/owl#Thing>, <http://xmlns.com/foaf/0.1/Agent>;\n  <http://purl.org/dc/terms/title> \"admin\" .\n\n<http://mobi.com/roles/user> a <http://mobi.com/ontologies/user/management#Role>,\n    <http://www.w3.org/2002/07/owl#Thing>, <http://xmlns.com/foaf/0.1/Agent>;\n  <http://purl.org/dc/terms/title> \"user\" .\n\n<http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997> a <http://mobi.com/ontologies/user/management#User>,\n    <http://www.w3.org/2002/07/owl#Thing>, <http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing>,\n    <http://www.w3.org/ns/prov#Agent>, <http://xmlns.com/foaf/0.1/Agent>, <http://xmlns.com/foaf/0.1/Person>;\n  <http://mobi.com/ontologies/user/management#hasUserRole> <http://mobi.com/roles/admin>,\n    <http://mobi.com/roles/user>;\n  <http://mobi.com/ontologies/user/management#password> \"{CRYPT}21232F297A57A5A743894A0E4A801FC3{CRYPT}\";\n  <http://mobi.com/ontologies/user/management#username> \"admin\" .\n\n<http://mobi.com/catalog-distributed> a <http://mobi.com/ontologies/catalog#Catalog>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://purl.org/dc/terms/description> \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\";\n  <http://purl.org/dc/terms/issued> \"2020-07-20T18:01:18.205-05:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>;\n  <http://purl.org/dc/terms/modified> \"2020-07-20T18:01:18.205-05:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>;\n  <http://purl.org/dc/terms/title> \"Mobi Catalog (Distributed)\" .\n\n<http://mobi.com/catalog-local> a <http://mobi.com/ontologies/catalog#Catalog>, <http://www.w3.org/2002/07/owl#Thing>;\n  <http://purl.org/dc/terms/description> \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\";\n  <http://purl.org/dc/terms/issued> \"2020-07-20T18:01:18.219-05:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>;\n  <http://purl.org/dc/terms/modified> \"2020-07-20T18:01:18.219-05:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>;\n  <http://purl.org/dc/terms/title> \"Mobi Catalog (Local)\" .\n\n<http://mobi.com/policies/all-access-versioned-rdf-record> a <http://mobi.com/ontologies/documents#BinaryFile>,\n    <http://mobi.com/ontologies/policy#Policy>, <http://mobi.com/ontologies/policy#PolicyFile>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://mobi.com/ontologies/documents#checksum> \"\\\"L\u0019�J)�9�����DYC�v��\u0012ge.��\u00174ڲ\u001f\u001d\";\n  <http://mobi.com/ontologies/documents#fileName> \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6.xml\";\n  <http://mobi.com/ontologies/documents#retrievalURL> <file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6>;\n  <http://mobi.com/ontologies/documents#size> 1.0577E4 .\n\n<http://mobi.com/policies/ontology-creation> a <http://mobi.com/ontologies/documents#BinaryFile>,\n    <http://mobi.com/ontologies/policy#Policy>, <http://mobi.com/ontologies/policy#PolicyFile>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://mobi.com/ontologies/documents#checksum> \"\"\"!\t�\u0019��\u0000�Y�0.$(8�\u0019c}VJܐYmȶ\u0014�8\u0000�\"\"\";\n  <http://mobi.com/ontologies/documents#fileName> \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780.xml\";\n  <http://mobi.com/ontologies/documents#retrievalURL> <file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780>;\n  <http://mobi.com/ontologies/documents#size> 3.429E3;\n  <http://mobi.com/ontologies/policy#relatedAction> <http://mobi.com/ontologies/policy#Create>;\n  <http://mobi.com/ontologies/policy#relatedResource> <http://mobi.com/catalog-local> .\n\n<http://mobi.com/policies/system-repo-access> a <http://mobi.com/ontologies/documents#BinaryFile>,\n    <http://mobi.com/ontologies/policy#Policy>, <http://mobi.com/ontologies/policy#PolicyFile>,\n    <http://www.w3.org/2002/07/owl#Thing>;\n  <http://mobi.com/ontologies/documents#checksum> \"f��\u001d�0�^^|?��\u001c-��C�\u0017{ |n��d����\";\n  <http://mobi.com/ontologies/documents#fileName> \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1.xml\";\n  <http://mobi.com/ontologies/documents#retrievalURL> <file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1>;\n  <http://mobi.com/ontologies/documents#size> 2.91E3;\n  <http://mobi.com/ontologies/policy#relatedAction> <http://mobi.com/ontologies/policy#Read>;\n  <http://mobi.com/ontologies/policy#relatedResource> <http://mobi.com/system-repo> .\n"
  };
}

export function rdfResponseText() {
  return {
    text: `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
    <rdf:RDF
      xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">
    
    <rdf:Description rdf:about=\"http://mobi.com/applications#mapping-tool\">
      <title xmlns=\"http://purl.org/dc/terms/\">Mapping Tool</title>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/platform/config#Application\"/>
      <description xmlns=\"http://purl.org/dc/terms/\">The built-in Mapping Tool application in Mobi.</description>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/applications#sparql-editor\">
      <title xmlns=\"http://purl.org/dc/terms/\">SPARQL Editor</title>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/platform/config#Application\"/>
      <description xmlns=\"http://purl.org/dc/terms/\">The built-in SPARQL Query Editor application in Mobi.</description>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/applications#ontology-editor\">
      <title xmlns=\"http://purl.org/dc/terms/\">Ontology Editor</title>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/platform/config#Application\"/>
      <description xmlns=\"http://purl.org/dc/terms/\">The built-in Ontology Editor application in Mobi.</description>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/roles/admin\">
      <title xmlns=\"http://purl.org/dc/terms/\">admin</title>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/user/management#Role\"/>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://xmlns.com/foaf/0.1/Agent\"/>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/roles/user\">
      <title xmlns=\"http://purl.org/dc/terms/\">user</title>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/user/management#Role\"/>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://xmlns.com/foaf/0.1/Agent\"/>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\">
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://xmlns.com/foaf/0.1/Agent\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/user/management#User\"/>
      <rdf:type rdf:resource=\"http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing\"/>
      <rdf:type rdf:resource=\"http://www.w3.org/ns/prov#Agent\"/>
      <rdf:type rdf:resource=\"http://xmlns.com/foaf/0.1/Person\"/>
      <hasUserRole xmlns=\"http://mobi.com/ontologies/user/management#\" rdf:resource=\"http://mobi.com/roles/admin\"/>
      <hasUserRole xmlns=\"http://mobi.com/ontologies/user/management#\" rdf:resource=\"http://mobi.com/roles/user\"/>
      <password xmlns=\"http://mobi.com/ontologies/user/management#\">{CRYPT}21232F297A57A5A743894A0E4A801FC3{CRYPT}</password>
      <username xmlns=\"http://mobi.com/ontologies/user/management#\">admin</username>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/catalog-distributed\">
      <title xmlns=\"http://purl.org/dc/terms/\">Mobi Catalog (Distributed)</title>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/catalog#Catalog\"/>
      <description xmlns=\"http://purl.org/dc/terms/\">The Mobi Catalog records datasets, ontologies, data mappings, and other resources.</description>
      <issued xmlns=\"http://purl.org/dc/terms/\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#dateTime\">2020-07-20T18:01:18.205-05:00</issued>
      <modified xmlns=\"http://purl.org/dc/terms/\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#dateTime\">2020-07-20T18:01:18.205-05:00</modified>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/catalog-local\">
      <title xmlns=\"http://purl.org/dc/terms/\">Mobi Catalog (Local)</title>
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/catalog#Catalog\"/>
      <description xmlns=\"http://purl.org/dc/terms/\">The Mobi Catalog records datasets, ontologies, data mappings, and other resources.</description>
      <issued xmlns=\"http://purl.org/dc/terms/\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#dateTime\">2020-07-20T18:01:18.219-05:00</issued>
      <modified xmlns=\"http://purl.org/dc/terms/\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#dateTime\">2020-07-20T18:01:18.219-05:00</modified>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/policies/all-access-versioned-rdf-record\">
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/documents#BinaryFile\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#Policy\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#PolicyFile\"/>
      <checksum xmlns=\"http://mobi.com/ontologies/documents#\">\"L\u0019�J)�9�����DYC�v��\u0012ge.��\u00174ڲ\u001f\u001d</checksum>
      <fileName xmlns=\"http://mobi.com/ontologies/documents#\">file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6.xml</fileName>
      <retrievalURL xmlns=\"http://mobi.com/ontologies/documents#\" rdf:resource=\"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6\"/>
      <size xmlns=\"http://mobi.com/ontologies/documents#\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#double\">10577.0</size>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/policies/ontology-creation\">
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/documents#BinaryFile\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#Policy\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#PolicyFile\"/>
      <checksum xmlns=\"http://mobi.com/ontologies/documents#\">!	�\u0019��\u0000�Y�0.$(8�\u0019c}VJܐYmȶ\u0014�8\u0000�</checksum>
      <fileName xmlns=\"http://mobi.com/ontologies/documents#\">file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780.xml</fileName>
      <retrievalURL xmlns=\"http://mobi.com/ontologies/documents#\" rdf:resource=\"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780\"/>
      <size xmlns=\"http://mobi.com/ontologies/documents#\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#double\">3429.0</size>
      <relatedAction xmlns=\"http://mobi.com/ontologies/policy#\" rdf:resource=\"http://mobi.com/ontologies/policy#Create\"/>
      <relatedResource xmlns=\"http://mobi.com/ontologies/policy#\" rdf:resource=\"http://mobi.com/catalog-local\"/>
    </rdf:Description>
    
    <rdf:Description rdf:about=\"http://mobi.com/policies/system-repo-access\">
      <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Thing\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/documents#BinaryFile\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#Policy\"/>
      <rdf:type rdf:resource=\"http://mobi.com/ontologies/policy#PolicyFile\"/>
      <checksum xmlns=\"http://mobi.com/ontologies/documents#\">f��\u001d�0�^^|?��\u001c-��C�\u0017{ |n��d����</checksum>
      <fileName xmlns=\"http://mobi.com/ontologies/documents#\">file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1.xml</fileName>
      <retrievalURL xmlns=\"http://mobi.com/ontologies/documents#\" rdf:resource=\"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1\"/>
      <size xmlns=\"http://mobi.com/ontologies/documents#\" rdf:datatype=\"http://www.w3.org/2001/XMLSchema#double\">2910.0</size>
      <relatedAction xmlns=\"http://mobi.com/ontologies/policy#\" rdf:resource=\"http://mobi.com/ontologies/policy#Read\"/>
      <relatedResource xmlns=\"http://mobi.com/ontologies/policy#\" rdf:resource=\"http://mobi.com/system-repo\"/>
    </rdf:Description>
    
    </rdf:RDF>`
  };
}

export function getJsonLDResponseText() {
  return  {
      text: `[ {
      \"@id\" : \"http://mobi.com/applications#mapping-tool\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/platform/config#Application\" ],
      \"http://purl.org/dc/terms/description\" : [ {
        \"@value\" : \"The built-in Mapping Tool application in Mobi.\"
      } ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"Mapping Tool\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/applications#ontology-editor\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/platform/config#Application\" ],
      \"http://purl.org/dc/terms/description\" : [ {
        \"@value\" : \"The built-in Ontology Editor application in Mobi.\"
      } ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"Ontology Editor\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/applications#sparql-editor\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/platform/config#Application\" ],
      \"http://purl.org/dc/terms/description\" : [ {
        \"@value\" : \"The built-in SPARQL Query Editor application in Mobi.\"
      } ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"SPARQL Editor\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/catalog-distributed\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/catalog#Catalog\" ],
      \"http://purl.org/dc/terms/description\" : [ {
        \"@value\" : \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\"
      } ],
      \"http://purl.org/dc/terms/issued\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",
        \"@value\" : \"2020-07-20T18:01:18.205-05:00\"
      } ],
      \"http://purl.org/dc/terms/modified\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",
        \"@value\" : \"2020-07-20T18:01:18.205-05:00\"
      } ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"Mobi Catalog (Distributed)\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/catalog-local\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/catalog#Catalog\" ],
      \"http://purl.org/dc/terms/description\" : [ {
        \"@value\" : \"The Mobi Catalog records datasets, ontologies, data mappings, and other resources.\"
      } ],
      \"http://purl.org/dc/terms/issued\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",
        \"@value\" : \"2020-07-20T18:01:18.219-05:00\"
      } ],
      \"http://purl.org/dc/terms/modified\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#dateTime\",
        \"@value\" : \"2020-07-20T18:01:18.219-05:00\"
      } ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"Mobi Catalog (Local)\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/policies/all-access-versioned-rdf-record\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/documents#BinaryFile\", \"http://mobi.com/ontologies/policy#Policy\", \"http://mobi.com/ontologies/policy#PolicyFile\" ],
      \"http://mobi.com/ontologies/documents#checksum\" : [ {
        \"@value\" : \"\\\"L\\u0019�J)�9�����DYC�v��\\u0012ge.��\\u00174ڲ\\u001F\\u001D\"
      } ],
      \"http://mobi.com/ontologies/documents#fileName\" : [ {
        \"@value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6.xml\"
      } ],
      \"http://mobi.com/ontologies/documents#retrievalURL\" : [ {
        \"@id\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/3a/5f/b3766aac44f6\"
      } ],
      \"http://mobi.com/ontologies/documents#size\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#double\",
        \"@value\" : \"10577.0\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/policies/ontology-creation\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/documents#BinaryFile\", \"http://mobi.com/ontologies/policy#Policy\", \"http://mobi.com/ontologies/policy#PolicyFile\" ],
      \"http://mobi.com/ontologies/documents#checksum\" : [ {
        \"@value\" : \"!\\t�\\u0019��\\u0000�Y�0.$(8�\\u0019c}VJܐYmȶ\\u0014�8\\u0000�\"
      } ],
      \"http://mobi.com/ontologies/documents#fileName\" : [ {
        \"@value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780.xml\"
      } ],
      \"http://mobi.com/ontologies/documents#retrievalURL\" : [ {
        \"@id\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/d8/7e/de3a30e9c780\"
      } ],
      \"http://mobi.com/ontologies/documents#size\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#double\",
        \"@value\" : \"3429.0\"
      } ],
      \"http://mobi.com/ontologies/policy#relatedAction\" : [ {
        \"@id\" : \"http://mobi.com/ontologies/policy#Create\"
      } ],
      \"http://mobi.com/ontologies/policy#relatedResource\" : [ {
        \"@id\" : \"http://mobi.com/catalog-local\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/policies/system-repo-access\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://mobi.com/ontologies/documents#BinaryFile\", \"http://mobi.com/ontologies/policy#Policy\", \"http://mobi.com/ontologies/policy#PolicyFile\" ],
      \"http://mobi.com/ontologies/documents#checksum\" : [ {
        \"@value\" : \"f��\\u001D�0�^^|?��\\u001C-��C�\\u0017{ |n��d����\"
      } ],
      \"http://mobi.com/ontologies/documents#fileName\" : [ {
        \"@value\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1.xml\"
      } ],
      \"http://mobi.com/ontologies/documents#retrievalURL\" : [ {
        \"@id\" : \"file:///Users/robert.alvarez/iNovex/mobi/mobi-distribution/target/mobi-distribution-1.18.15-SNAPSHOT/data/policies/11/a0/724a444152c1\"
      } ],
      \"http://mobi.com/ontologies/documents#size\" : [ {
        \"@type\" : \"http://www.w3.org/2001/XMLSchema#double\",
        \"@value\" : \"2910.0\"
      } ],
      \"http://mobi.com/ontologies/policy#relatedAction\" : [ {
        \"@id\" : \"http://mobi.com/ontologies/policy#Read\"
      } ],
      \"http://mobi.com/ontologies/policy#relatedResource\" : [ {
        \"@id\" : \"http://mobi.com/system-repo\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/roles/admin\",
      \"@type\" : [ \"http://mobi.com/ontologies/user/management#Role\", \"http://www.w3.org/2002/07/owl#Thing\", \"http://xmlns.com/foaf/0.1/Agent\" ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"admin\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/roles/user\",
      \"@type\" : [ \"http://mobi.com/ontologies/user/management#Role\", \"http://www.w3.org/2002/07/owl#Thing\", \"http://xmlns.com/foaf/0.1/Agent\" ],
      \"http://purl.org/dc/terms/title\" : [ {
        \"@value\" : \"user\"
      } ]
    }, {
      \"@id\" : \"http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997\",
      \"@type\" : [ \"http://www.w3.org/2002/07/owl#Thing\", \"http://xmlns.com/foaf/0.1/Agent\", \"http://mobi.com/ontologies/user/management#User\", \"http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing\", \"http://www.w3.org/ns/prov#Agent\", \"http://xmlns.com/foaf/0.1/Person\" ],
      \"http://mobi.com/ontologies/user/management#hasUserRole\" : [ {
        \"@id\" : \"http://mobi.com/roles/admin\"
      }, {
        \"@id\" : \"http://mobi.com/roles/user\"
      } ],
      \"http://mobi.com/ontologies/user/management#password\" : [ {
        \"@value\" : \"{CRYPT}21232F297A57A5A743894A0E4A801FC3{CRYPT}\"
      } ],
      \"http://mobi.com/ontologies/user/management#username\" : [ {
        \"@value\" : \"admin\"
      } ]
    } ]`
  }
}