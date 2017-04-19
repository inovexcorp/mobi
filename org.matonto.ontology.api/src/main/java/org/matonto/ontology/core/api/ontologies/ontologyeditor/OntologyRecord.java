
package org.matonto.ontology.core.api.ontologies.ontologyeditor;

/*-
 * #%L
 * org.matonto.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import java.util.Optional;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.orm.OrmException;


/**
 * Generated class representing things with the type: http://matonto.org/ontologies/ontology-editor#OntologyRecord
 * 
 */
public interface OntologyRecord extends VersionedRDFRecord, OntologyEditor_Thing
{

    /**
     * The rdf:type IRI of this class.
     * 
     */
    public final static String TYPE = "http://matonto.org/ontologies/ontology-editor#OntologyRecord";
    /**
     * IRI of the predicate that this property will represent.<br><br>Domain: http://www.w3.org/2001/XMLSchema#anyURI
     * 
     */
    public final static String ontologyIRI_IRI = "http://matonto.org/ontologies/ontology-editor#ontologyIRI";
    /**
     * The default implementation for this interface
     * 
     */
    public final static Class<? extends OntologyRecord> DEFAULT_IMPL = OntologyRecordImpl.class;

    /**
     * Get the ontologyIRI property from this instance of a http://matonto.org/ontologies/ontology-editor#OntologyRecord' type.<br><br>The latest ontology IRI on the master branch.
     * 
     * @return
     *     The ontologyIRI {@link java.util.Optional<org.matonto.rdf.api.IRI>} value for this instance
     */
    public Optional<IRI> getOntologyIRI()
        throws OrmException
    ;

    public void setOntologyIRI(IRI arg)
        throws OrmException
    ;

}
