package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.AnonymousIndividual;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.NamedIndividual;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.classexpression.OClass;
import com.mobi.ontology.core.api.datarange.Datatype;
import com.mobi.ontology.core.api.propertyexpression.AnnotationProperty;
import com.mobi.ontology.core.api.propertyexpression.DataProperty;
import com.mobi.ontology.core.api.propertyexpression.ObjectProperty;
import com.mobi.ontology.core.impl.owlapi.classexpression.SimpleClass;
import com.mobi.ontology.core.impl.owlapi.datarange.SimpleDatatype;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleAnnotationProperty;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.semanticweb.owlapi.model.NodeID;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAnnotationValue;
import org.semanticweb.owlapi.model.OWLAnonymousIndividual;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLIndividual;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLNamedIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationPropertyImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLAnonymousIndividualImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLDataPropertyImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLDatatypeImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLNamedIndividualImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLObjectPropertyImpl;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component (immediate = true)
public class SimpleOntologyValues {
    
    private static ValueFactory factory;
    private static OntologyManager ontologyManager;
    private static SesameTransformer sesameTransformer;
    private static BNodeService bNodeService;
    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyValues.class);
    
    @Activate
    public void activate() {
        LOG.info("Activating the SimpleOntologyValues");
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating the SimpleOntologyValues");
    }
    
    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setOntologyManager(final OntologyManager manager) {
        ontologyManager = manager;
    }

    @Reference
    protected void setTransformer(final SesameTransformer transformer) {
        sesameTransformer = transformer;
    }

    @Reference
    protected void setbNodeService(final BNodeService service) {
        bNodeService = service;
    }

    public SimpleOntologyValues() {}

    /**
     * .
     */
    public static OWLOntology owlapiOntology(Ontology ontology) {
        if (ontology == null) {
            return null;
        }
        return ((SimpleOntology)ontology).getOwlapiOntology();
    }

    /**
     * .
     */
    public static IRI mobiIRI(org.semanticweb.owlapi.model.IRI owlIri) {
        if (owlIri == null) {
            throw new IllegalArgumentException("IRI cannot be null.");
        }
        return factory.createIRI(owlIri.toString());
    }

    /**
     * .
     */
    public static org.semanticweb.owlapi.model.IRI owlapiIRI(IRI mobiIri) {
        if (mobiIri == null) {
            return null;
        }
        return org.semanticweb.owlapi.model.IRI.create(mobiIri.stringValue());
    }

    /**
     * .
     */
    public static AnonymousIndividual mobiAnonymousIndividual(OWLAnonymousIndividual owlIndividual) {
        if (owlIndividual == null) {
            return null;
        }
        return new SimpleAnonymousIndividual(owlIndividual.getID());
    }

    /**
     * .
     */
    public static OWLAnonymousIndividual owlapiAnonymousIndividual(AnonymousIndividual individual) {
        if (individual == null) {
            return null;
        }
        return new OWLAnonymousIndividualImpl(NodeID.getNodeID(individual.getId()));
    }

    /**
     * .
     */
    public static Literal mobiLiteral(OWLLiteral owlLiteral) {
        if (owlLiteral == null) {
            return null;
        }
        String datatypeIRIStr = owlLiteral.getDatatype().getIRI().toString();

        if (datatypeIRIStr.equals("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")) {
            return factory.createLiteral(owlLiteral.getLiteral(), "en");
        } else if (owlLiteral.hasLang()) {
            return factory.createLiteral(owlLiteral.getLiteral(), owlLiteral.getLang());
        } else {
            return factory.createLiteral(owlLiteral.getLiteral(), mobiDatatype(owlLiteral.getDatatype()).getIRI());
        }
    }

    /**
     * .
     */
    public static OWLLiteral owlapiLiteral(Literal literal) {
        if (literal == null) {
            return null;
        }
        Datatype datatype = new SimpleDatatype(literal.getDatatype());
        return new OWLLiteralImpl(literal.getLabel(), literal.getLanguage().orElse(null), owlapiDatatype(datatype));
    }

    /**
     * .
     */
    public static Annotation mobiAnnotation(OWLAnnotation owlAnno) {
        // TODO: ??? Fix this.
        if (owlAnno == null) {
            return null;
        }
        Set<OWLAnnotation> owlAnnos = owlAnno.annotations().collect(Collectors.toSet());
        if (owlAnnos.isEmpty()) {
            AnnotationProperty property = mobiAnnotationProperty(owlAnno.getProperty());
            OWLAnnotationValue value = owlAnno.getValue();
            if (value instanceof OWLLiteral) {
                OWLLiteral literal = (OWLLiteral) value;
                Literal simpleLiteral = mobiLiteral(literal);
                return new SimpleAnnotation(property, simpleLiteral, new HashSet<>());
            } else if (value instanceof org.semanticweb.owlapi.model.IRI) {
                org.semanticweb.owlapi.model.IRI iri = (org.semanticweb.owlapi.model.IRI) value;
                IRI simpleIri = mobiIRI(iri);
                return new SimpleAnnotation(property, simpleIri, new HashSet<>());
            } else if (value instanceof OWLAnonymousIndividual) {
                OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
                AnonymousIndividual simpleIndividual = mobiAnonymousIndividual(individual);
                return new SimpleAnnotation(property, simpleIndividual, new HashSet<>());
            } else {
                throw new OWLRuntimeException("Invalid annotation value");
            }
        } else {
            Set<Annotation> annos = new HashSet<>();
            //Get annotations recursively
            for (OWLAnnotation a : owlAnnos) {
                annos.add(mobiAnnotation(a));
            }
            AnnotationProperty property = mobiAnnotationProperty(owlAnno.getProperty());
            OWLAnnotationValue value = owlAnno.getValue();
            if (value instanceof OWLLiteral) {
                OWLLiteral literal = (OWLLiteral) value;
                Literal simpleLiteral = mobiLiteral(literal);
                return new SimpleAnnotation(property, simpleLiteral, annos);
            } else if (value instanceof org.semanticweb.owlapi.model.IRI) {
                org.semanticweb.owlapi.model.IRI iri = (org.semanticweb.owlapi.model.IRI) value;
                IRI simpleIri = mobiIRI(iri);
                return new SimpleAnnotation(property, simpleIri, annos);
            } else if (value instanceof OWLAnonymousIndividual) {
                OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
                AnonymousIndividual simpleIndividual = mobiAnonymousIndividual(individual);
                return new SimpleAnnotation(property, simpleIndividual, annos);
            } else {
                throw new OWLRuntimeException("Invalid annotation value");
            }
        }
    }

    /**
     * .
     */
    public static OWLAnnotation owlapiAnnotation(Annotation anno) {
        // TODO: ??? Fix this.
        if (anno == null) {
            return null;
        }
        if (!anno.isAnnotated()) {
            OWLAnnotationProperty owlAnnoProperty = owlapiAnnotationProperty(anno.getProperty());
            Value value = anno.getValue();
            if (value instanceof IRI) {
                org.semanticweb.owlapi.model.IRI iri = owlapiIRI((IRI) value);
                return new OWLAnnotationImpl(owlAnnoProperty, iri, Stream.empty());
            } else if (value instanceof Literal) {
                OWLLiteral literal = owlapiLiteral((Literal) value);
                return new OWLAnnotationImpl(owlAnnoProperty, literal, Stream.empty());
            } else if (value instanceof SimpleAnonymousIndividual) {
                OWLAnonymousIndividual individual = owlapiAnonymousIndividual((SimpleAnonymousIndividual) value);
                return new OWLAnnotationImpl(owlAnnoProperty, individual, Stream.empty());
            } else {
                throw new MobiOntologyException("Invalid annotation value");
            }
        } else {
            Set<Annotation> annos = anno.getAnnotations();
            Set<OWLAnnotation> owlAnnos = new HashSet<>();
            //Get annotations recursively
            for (Annotation a : annos) {
                owlAnnos.add(owlapiAnnotation(a));
            }
            OWLAnnotationProperty owlAnnoProperty = owlapiAnnotationProperty(anno.getProperty());
            Value value = anno.getValue();
            if (value instanceof IRI) {
                org.semanticweb.owlapi.model.IRI iri = owlapiIRI((IRI)value);
                return new OWLAnnotationImpl(owlAnnoProperty, iri, owlAnnos.stream());
            } else if (value instanceof Literal) {
                OWLLiteral literal = owlapiLiteral((Literal) value);
                return new OWLAnnotationImpl(owlAnnoProperty, literal, owlAnnos.stream());
            } else if (value instanceof SimpleAnonymousIndividual) {
                OWLAnonymousIndividual individual = owlapiAnonymousIndividual((SimpleAnonymousIndividual)value);
                return new OWLAnnotationImpl(owlAnnoProperty, individual, owlAnnos.stream());
            } else {
                throw new MobiOntologyException("Invalid annotation value");
            }
        }
    }

    /**
     * .
     */
    public static NamedIndividual mobiNamedIndividual(OWLNamedIndividual owlapiIndividual) {
        if (owlapiIndividual == null) {
            return null;
        }
        org.semanticweb.owlapi.model.IRI owlapiIri = owlapiIndividual.getIRI();
        IRI mobiIri = mobiIRI(owlapiIri);
        return new SimpleNamedIndividual(mobiIri);
    }

    /**
     * .
     */
    public static OWLNamedIndividual owlapiNamedIndividual(NamedIndividual mobiIndividual) {
        if (mobiIndividual == null) {
            return null;
        }
        IRI mobiIri = mobiIndividual.getIRI();
        org.semanticweb.owlapi.model.IRI owlapiIri = owlapiIRI(mobiIri);
        return new OWLNamedIndividualImpl(owlapiIri);
    }

    /**
     * .
     */
    public static Individual mobiIndividual(OWLIndividual owlapiIndividual) {
        if (owlapiIndividual instanceof OWLAnonymousIndividual) {
            return mobiAnonymousIndividual((OWLAnonymousIndividual) owlapiIndividual);
        } else {
            return mobiNamedIndividual((OWLNamedIndividual) owlapiIndividual);
        }
    }

    /**
     * .
     */
    public static OWLIndividual owlapiIndividual(Individual mobiIndividual) {
        if (mobiIndividual instanceof AnonymousIndividual) {
            return owlapiAnonymousIndividual((AnonymousIndividual) mobiIndividual);
        } else {
            return owlapiNamedIndividual((NamedIndividual) mobiIndividual);
        }
    }

    /**
     * .
     */
    public static OntologyId mobiOntologyId(OWLOntologyID owlId) {
        if (owlId == null) {
            return null;
        }
        Optional<org.semanticweb.owlapi.model.IRI> ontologyIRI = owlId.getOntologyIRI();
        Optional<org.semanticweb.owlapi.model.IRI> versionIRI = owlId.getVersionIRI();
        if (versionIRI.isPresent()) {
            return new SimpleOntologyId.Builder(factory).ontologyIRI(mobiIRI(ontologyIRI.get()))
                .versionIRI(mobiIRI(versionIRI.get())).build();
        } else if (ontologyIRI.isPresent()) {
            return new SimpleOntologyId.Builder(factory).ontologyIRI(mobiIRI(ontologyIRI.get())).build();
        } else {
            return new SimpleOntologyId.Builder(factory).build();
        }
    }

    /**
     * .
     */
    public static OWLOntologyID owlapiOntologyId(OntologyId simpleId) {
        if (simpleId == null) {
            return null;
        }
        if (simpleId instanceof SimpleOntologyId) {
            return ((SimpleOntologyId) simpleId).getOwlapiOntologyId();
        } else {
            Optional<IRI> ontologyIRI = simpleId.getOntologyIRI();
            Optional<IRI> versionIRI = simpleId.getVersionIRI();
            if (versionIRI.isPresent()) {
                return new OWLOntologyID(Optional.of(owlapiIRI(ontologyIRI.get())),
                        Optional.of(owlapiIRI(versionIRI.get())));
            } else if (ontologyIRI.isPresent()) {
                return new OWLOntologyID(Optional.of(owlapiIRI(ontologyIRI.get())), Optional.empty());
            } else {
                return new OWLOntologyID();
            }
        }
    }

    /**
     * .
     */
    public static OClass mobiClass(OWLClass owlapiClass) {
        if (owlapiClass == null) {
            return null;
        }
        return new SimpleClass(mobiIRI(owlapiClass.getIRI()));
    }

    /**
     * .
     */
    public static OWLClass owlapiClass(OClass mobiClass) {
        if (mobiClass == null) {
            return null;
        }
        return new OWLClassImpl(owlapiIRI(mobiClass.getIRI()));
    }

    /**
     * .
     */
    public static Datatype mobiDatatype(OWLDatatype datatype) {
        if (datatype == null) {
            return null;
        } else {
            return new SimpleDatatype(mobiIRI(datatype.getIRI()));
        }
    }

    /**
     * .
     */
    public static OWLDatatype owlapiDatatype(Datatype datatype) {
        return new OWLDatatypeImpl(owlapiIRI(datatype.getIRI()));
    }

    /**
     * .
     */
    public static ObjectProperty mobiObjectProperty(OWLObjectProperty property) {
        if (property == null) {
            return null;
        }
        return new SimpleObjectProperty(mobiIRI(property.getIRI()));
    }

    /**
     * .
     */
    public static OWLObjectProperty owlapiObjectProperty(ObjectProperty property) {
        if (property == null) {
            return null;
        }
        return new OWLObjectPropertyImpl(owlapiIRI(property.getIRI()));
    }

    /**
     * .
     */
    public static DataProperty mobiDataProperty(OWLDataProperty property) {
        if (property == null) {
            return null;
        }
        return new SimpleDataProperty(mobiIRI(property.getIRI()));
    }

    /**
     * .
     */
    public static OWLDataProperty owlapiDataProperty(DataProperty property) {
        if (property == null) {
            return null;
        }
        return new OWLDataPropertyImpl(owlapiIRI(property.getIRI()));
    }

    /**
     * .
     */
    public static AnnotationProperty mobiAnnotationProperty(OWLAnnotationProperty property) {
        if (property == null) {
            return null;
        }
        return new SimpleAnnotationProperty(mobiIRI(property.getIRI()));
    }

    /**
     * .
     */
    public static OWLAnnotationProperty owlapiAnnotationProperty(AnnotationProperty property) {
        if (property == null) {
            return null;
        }
        return new OWLAnnotationPropertyImpl(owlapiIRI(property.getIRI()));
    }
}
