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
export const OBJ_PROPERTY_VALUES_QUERY = `PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT
?value
WHERE {
  {
    BIND(<%PROPIRI%> as ?prop)
    Optional {
      {
        # Simple ranges set on property or parent property
        ?prop rdfs:subPropertyOf*/rdfs:range ?r .
        FILTER (isIRI(?r))
      } UNION {
        # Union Of ranges set on property or parent property (only nested one level)
        ?prop rdfs:subPropertyOf*/rdfs:range ?bnode .
        FILTER(isBlank(?bnode))
        ?bnode owl:unionOf/rdf:rest*/rdf:first ?r .
        FILTER(isIRI(?r))
      }
    }
  }
  BIND(IF(BOUND(?r), ?r, <http://www.w3.org/2002/07/owl#Class>) AS ?type)

  # Collect instances of the range types, either directly or instances of subtypes
  ?value a ?subType .
  ?subType rdfs:subClassOf* | a ?type .
  FILTER(isIRI(?value))
  FILTER(?subType != <http://www.w3.org/2002/07/owl#Class>)
}`;
