package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.matonto.ontology.core.api.*;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.axiom.DeclarationAxiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.datarange.DataOneOf;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.ontology.core.api.types.ClassExpressionType;
import org.matonto.ontology.core.api.types.DataRangeType;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.api.types.Facet;
import org.matonto.ontology.core.impl.owlapi.axiom.SimpleDeclarationAxiom;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleClass;
import org.matonto.ontology.core.impl.owlapi.datarange.SimpleDataOneOf;
import org.matonto.ontology.core.impl.owlapi.datarange.SimpleDatatype;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleAnnotationProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import org.matonto.ontology.core.utils.MatontoOntologyException;

import org.semanticweb.owlapi.model.*;
import org.semanticweb.owlapi.vocab.OWLFacet;
import uk.ac.manchester.cs.owl.owlapi.*;


public class Values {

	private Values() {}

	public static OntologyIRI matontoIRI(IRI owlIri) 
	{
		if (owlIri == null)
		    throw new IllegalArgumentException("IRI cannot be null.");
		
		if (!owlIri.getRemainder().isPresent())
		    throw new IllegalArgumentException("IRI must have a remainder.");
		
		return new SimpleIRI(owlIri.getNamespace(), owlIri.getRemainder().get());
	}
	
	public static IRI owlapiIRI(OntologyIRI matontoIri) 
	{
		if (matontoIri == null)
			return null;
		
		return IRI.create(matontoIri.getNamespace(), matontoIri.getLocalName().orElse(null));
	}
	
	public static AnonymousIndividual matontoAnonymousIndividual(OWLAnonymousIndividual owlIndividual)
	{
		if(owlIndividual == null)
			return null;
		
		return new SimpleAnonymousIndividual(owlIndividual.getID());
	}

	public static OWLAnonymousIndividual owlapiAnonymousIndividual(AnonymousIndividual individual)
	{
		if(individual == null)
			return null;
	
		return new OWLAnonymousIndividualImpl(NodeID.getNodeID(individual.getId()));
	}

	public static Literal matontoLiteral(OWLLiteral owlLiteral)
	{
		if(owlLiteral == null)
			return null;
		
		return new SimpleLiteral(owlLiteral.getLiteral(), owlLiteral.getLang(), matontoDatatype(owlLiteral.getDatatype()));
	}

	public static OWLLiteral owlapiLiteral(Literal literal)
	{
		if(literal == null)
			return null;
		
		return new OWLLiteralImpl(literal.getLiteral(), literal.getLanguage(), owlapiDatatype(literal.getDatatype()));
	}

	public static Annotation matontoAnnotation(OWLAnnotation owlAnno)
	{
		if(owlAnno == null)
			return null;
		
		Set<OWLAnnotation> owlAnnos = owlAnno.getAnnotations();
		if(owlAnnos.isEmpty()) {
			AnnotationProperty property = matontoAnnotationProperty(owlAnno.getProperty());
			OWLAnnotationValue value = owlAnno.getValue();
			if(value instanceof OWLLiteral){
				OWLLiteral literal = (OWLLiteral) value;
				Literal simpleLiteral = matontoLiteral(literal);
				return new SimpleAnnotation(property, simpleLiteral, new HashSet<>());
			}
			
			else if(value instanceof IRI){
				IRI iri = (IRI) value;
				OntologyIRI simpleIri = matontoIRI(iri);
				return new SimpleAnnotation(property, simpleIri, new HashSet<>());
			}
			
			else if(value instanceof OWLAnonymousIndividual){
				OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
				AnonymousIndividual simpleIndividual = matontoAnonymousIndividual(individual);
				return new SimpleAnnotation(property, simpleIndividual, new HashSet<>());
			}
			
			else
				throw new OWLRuntimeException("Invalid annotation value");
		}
		
		else {
			Set<Annotation> annos = new HashSet<>();
			//Get annotations recursively
			for(OWLAnnotation a : owlAnnos) {
				annos.add(matontoAnnotation(a));
			}
			
			AnnotationProperty property = matontoAnnotationProperty(owlAnno.getProperty());
			OWLAnnotationValue value = owlAnno.getValue();
			if(value instanceof OWLLiteral){
				OWLLiteral literal = (OWLLiteral) value;
				Literal simpleLiteral = matontoLiteral(literal);
				return new SimpleAnnotation(property, simpleLiteral, annos);
			}
			
			else if(value instanceof IRI){
				IRI iri = (IRI) value;
				OntologyIRI simpleIri = matontoIRI(iri);
				return new SimpleAnnotation(property, simpleIri, annos);
			}
			
			else if(value instanceof OWLAnonymousIndividual){
				OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
				AnonymousIndividual simpleIndividual = matontoAnonymousIndividual(individual);
				return new SimpleAnnotation(property, simpleIndividual, annos);
			}
			
			else
				throw new OWLRuntimeException("Invalid annotation value");
		}
	}
	
	public static OWLAnnotation owlapiAnnotation(Annotation anno)
	{		
		if(anno == null)
			return null;
					
		if(!anno.isAnnotated()) {
			OWLAnnotationProperty owlAnnoProperty = owlapiAnnotationProperty(anno.getProperty());
			AnnotationValue value = anno.getValue();
			if(value instanceof SimpleIRI) {
				IRI iri = owlapiIRI((SimpleIRI)value);
				return new OWLAnnotationImpl(owlAnnoProperty, iri, new HashSet<>());
			}
			
			else if(value instanceof SimpleLiteral) {
				OWLLiteral literal = owlapiLiteral((SimpleLiteral) value);
				return new OWLAnnotationImpl(owlAnnoProperty, literal, new HashSet<>());
			}
			
			else if(value instanceof SimpleAnonymousIndividual) {
				OWLAnonymousIndividual individual = owlapiAnonymousIndividual((SimpleAnonymousIndividual)value);
				return new OWLAnnotationImpl(owlAnnoProperty, individual, new HashSet<>());
			}
			
			else
				throw new MatontoOntologyException("Invalid annotation value");
		}
		
		else {
			Set<Annotation> annos = anno.getAnnotations();
			Set<OWLAnnotation> owlAnnos = new HashSet<>();
			
			//Get annotations recursively
			for(Annotation a : annos) {
				owlAnnos.add(owlapiAnnotation(a));
			}
			
			OWLAnnotationProperty owlAnnoProperty = owlapiAnnotationProperty(anno.getProperty());
			AnnotationValue value = anno.getValue();
			if(value instanceof SimpleIRI) {
				IRI iri = owlapiIRI((SimpleIRI)value);
				return new OWLAnnotationImpl(owlAnnoProperty, iri, owlAnnos);
			}
			
			else if(value instanceof SimpleLiteral) {
				OWLLiteral literal = owlapiLiteral((SimpleLiteral)value);
				return new OWLAnnotationImpl(owlAnnoProperty, literal, owlAnnos);
			}
			
			else if(value instanceof SimpleAnonymousIndividual) {
				OWLAnonymousIndividual individual = owlapiAnonymousIndividual((SimpleAnonymousIndividual)value);
				return new OWLAnnotationImpl(owlAnnoProperty, individual, owlAnnos);
			}
			
			else
				throw new MatontoOntologyException("Invalid annotation value");
			
		}
		
	}
	
	public static NamedIndividual matontoNamedIndividual(OWLNamedIndividual owlapiIndividual)
	{
		if(owlapiIndividual == null)
			return null;
					
		IRI owlapiIri = owlapiIndividual.getIRI();
		OntologyIRI matontoIri = matontoIRI(owlapiIri);
		return new SimpleNamedIndividual(matontoIri);
	}
	
	public static OWLNamedIndividual owlapiNamedIndividual(NamedIndividual matontoIndividual)
	{
		if(matontoIndividual == null)
			return null;
		
		OntologyIRI matontoIri = matontoIndividual.getIRI();
		IRI owlapiIri = owlapiIRI(matontoIri);
		return new OWLNamedIndividualImpl(owlapiIri);
	}

	public static OntologyId matontoOntologyId(OWLOntologyID owlId) 
	{
		if(owlId == null)
			return null;
					
		com.google.common.base.Optional<IRI> oIRI = owlId.getOntologyIRI();
		com.google.common.base.Optional<IRI> vIRI = owlId.getVersionIRI();

        if (vIRI.isPresent()) {
            return new SimpleOntologyId(matontoIRI(oIRI.get()), matontoIRI(vIRI.get()));
        } else if (oIRI.isPresent()) {
            return new SimpleOntologyId(matontoIRI(oIRI.get()));
        } else {
            return new SimpleOntologyId();
        }
	}	
	
	public static OWLOntologyID owlapiOntologyId(SimpleOntologyId simpleId) 
	{
		if(simpleId == null)
			return null;
		
		return simpleId.getOwlapiOntologyId();
	}
	
	public static OClass matontoClass(OWLClass owlapiClass)
	{
		if(owlapiClass == null)
			return null;
		
		return new SimpleClass(matontoIRI(owlapiClass.getIRI()));
	}
	
	
	public static OWLClass owlapiClass(OClass matontoClass)
	{
		if(matontoClass == null)
			return null;
		
		return new OWLClassImpl(owlapiIRI(matontoClass.getIRI()));
	}
	
	public static Datatype matontoDatatype(OWLDatatype datatype)
	{
		if(datatype == null)
			return null;
		
		else
		    return new SimpleDatatype(matontoIRI(datatype.getIRI()));
	}
	
	public static OWLDatatype owlapiDatatype(Datatype datatype)
	{
		return new OWLDatatypeImpl(owlapiIRI(datatype.getIRI()));
	}
	
	public static AxiomType matontoAxiomType(org.semanticweb.owlapi.model.AxiomType axiomType)
	{
		if(axiomType == null)
			return null;
		
		return AxiomType.valueOf(axiomType.getName());
	}
	
	public static org.semanticweb.owlapi.model.AxiomType owlapiAxiomType(AxiomType axiomType)
	{
		if(axiomType == null)
			return null;
		
		return org.semanticweb.owlapi.model.AxiomType.getAxiomType(axiomType.getName());
	}
	
	public static EntityType matontoEntityType(org.semanticweb.owlapi.model.EntityType entityType)
	{
		if(entityType == null)
			return null;
		
		return EntityType.valueOf(entityType.getName());
	}
	
	public static org.semanticweb.owlapi.model.EntityType owlapiEntityType(EntityType entityType)
	{
		if(entityType == null)
			return null;
		
		org.semanticweb.owlapi.model.EntityType owlapiType;
		String type = entityType.getName();
		switch (type) {
			case "Class": 
				owlapiType = org.semanticweb.owlapi.model.EntityType.CLASS;
				break;
				
			case "ObjectProperty":
				owlapiType = org.semanticweb.owlapi.model.EntityType.OBJECT_PROPERTY;
				break;
				
			case "DataProperty": 
				owlapiType = org.semanticweb.owlapi.model.EntityType.DATA_PROPERTY;
				break;
				
			case "AnnotationProperty": 
				owlapiType = org.semanticweb.owlapi.model.EntityType.ANNOTATION_PROPERTY;
				break;
				
			case "NamedIndividual": 
				owlapiType = org.semanticweb.owlapi.model.EntityType.NAMED_INDIVIDUAL;
				break;
				
			case "Datatype": 
				owlapiType = org.semanticweb.owlapi.model.EntityType.DATATYPE;
				break;
				
            default:
                return null;
		}
		
		return owlapiType;
	}
	
	public static ClassExpressionType matontoClassExpressionType(org.semanticweb.owlapi.model.ClassExpressionType classExpressionType)
	{
		if(classExpressionType == null)
			return null;
		
		return ClassExpressionType.valueOf(classExpressionType.getName());
	}
	
	public static org.semanticweb.owlapi.model.ClassExpressionType owlapiClassExpressionType(ClassExpressionType classExpressionType)
	{
		if(classExpressionType == null)
			return null;
		
		return org.semanticweb.owlapi.model.ClassExpressionType.valueOf(classExpressionType.getName());
	}
	
	public static DataRangeType matontoDataRangeType(org.semanticweb.owlapi.model.DataRangeType dataRangeType)
	{
		if(dataRangeType == null)
			return null;
		
		return DataRangeType.valueOf(dataRangeType.getName());
	}
	
	public static org.semanticweb.owlapi.model.DataRangeType owlapiDataRangeType(DataRangeType dataRangeType)
	{
		if(dataRangeType == null)
			return null;
		
		return org.semanticweb.owlapi.model.DataRangeType.valueOf(dataRangeType.getName());
	}
	
	public static Facet matontoFacet(OWLFacet facet)
	{
		if(facet == null)
			return null;
		
		return Facet.valueOf(facet.getShortForm());
	}
	
	public static OWLFacet owlapiFacet(Facet facet)
	{
		if(facet == null)
			return null;
		
		return OWLFacet.valueOf(facet.getShortForm());
	}
	
	public static FacetRestriction matontoFacetRestriction(OWLFacetRestriction facetRestriction)
	{
		if(facetRestriction == null)
			return null;
					
		return new SimpleFacetRestriction(matontoFacet(facetRestriction.getFacet()), matontoLiteral(facetRestriction.getFacetValue()));	
	}
	
	public static OWLFacetRestriction owlapiFacetRestriction(FacetRestriction facetRestriction)
	{
		if(facetRestriction == null)
			return null;
		
		return new OWLFacetRestrictionImpl(owlapiFacet(facetRestriction.getFacet()), owlapiLiteral(facetRestriction.getFacetValue()));
	}
	
	public static DataOneOf matontoDataOneOf(OWLDataOneOf dataOneOf)
	{
		if(dataOneOf == null)
			return null;
		
		Set<OWLLiteral> values = dataOneOf.getValues();
		Set<Literal> matontoValues = new HashSet<>();
		for(OWLLiteral value : values)
			matontoValues.add(matontoLiteral(value));
		
		return new SimpleDataOneOf(matontoValues);
	}
	
	public static OWLDataOneOf owlapiDataOneOf(DataOneOf dataOneOf)
	{
		if(dataOneOf == null)
			return null;
		
		Set<Literal> values = dataOneOf.getValues();
		Set<OWLLiteral> owlapiValues = new HashSet<>();
		for(Literal value : values)
			owlapiValues.add(owlapiLiteral(value));
		
		return new OWLDataOneOfImpl(owlapiValues);
	}
	
	public static ObjectProperty matontoObjectProperty(OWLObjectProperty property)
	{
		if(property == null)
			return null;
		
		return new SimpleObjectProperty(matontoIRI(property.getIRI()));
	}
	
	public static OWLObjectProperty owlapiObjectProperty(ObjectProperty property)
	{
		if(property == null)
			return null;
		
		return new OWLObjectPropertyImpl(owlapiIRI(property.getIRI()));
	}
	
	public static DataProperty matontoDataProperty(OWLDataProperty property)
	{
		if(property == null)
			return null;
		
		return new SimpleDataProperty(matontoIRI(property.getIRI()));
	}
		
	public static OWLDataProperty owlapiDataProperty(DataProperty property)
	{
		if(property == null)
			return null;
		
		return new OWLDataPropertyImpl(owlapiIRI(property.getIRI()));
	}
	
	public static AnnotationProperty matontoAnnotationProperty(OWLAnnotationProperty property)
	{
		if(property == null)
			return null;
		
		return new SimpleAnnotationProperty(matontoIRI(property.getIRI()));
	}
	
	public static OWLAnnotationProperty owlapiAnnotationProperty(AnnotationProperty property)
	{
		if(property == null)
			return null;
		
		return new OWLAnnotationPropertyImpl(owlapiIRI(property.getIRI()));
	}
	   
    /*
     * MUST Implement!!!!!!!
     */
    public static Axiom matontoAxiom(OWLAxiom owlapiAxiom)
    {
        throw new UnsupportedOperationException();
    }
    
    /*
     * MUST Implement!!!!!!!
     */
    public static OWLAxiom owlapiAxiom(Axiom matontoAxiom)
    {
        throw new UnsupportedOperationException();
    }

	public static DeclarationAxiom matonotoDeclarationAxiom(OWLDeclarationAxiom owlapiAxiom)
	{
		OWLEntity owlapiEntity = owlapiAxiom.getEntity();
		Entity matontoEntity;
		switch(owlapiEntity.getEntityType().getName()) {
			case "Class":
				matontoEntity = matontoClass((OWLClass) owlapiEntity);
				break;
			
			case "ObjectProperty":
				matontoEntity = matontoObjectProperty((OWLObjectProperty) owlapiEntity);
				break;
				
			case "DataProperty":
				matontoEntity = matontoDataProperty((OWLDataProperty) owlapiEntity);
				break;
				
			case "AnnotationProperty":
				matontoEntity = matontoAnnotationProperty((OWLAnnotationProperty) owlapiEntity);
				break;
				
			case "NamedIndividual":
				matontoEntity = matontoNamedIndividual((OWLNamedIndividual) owlapiEntity);
				break;
				
			case "Datatype":
				matontoEntity = matontoDatatype((OWLDatatype) owlapiEntity);
				break;
				
			default:
			    return null;
		}
		
		Set<OWLAnnotation> owlapiAnnotations = owlapiAxiom.getAnnotations();
		Set<Annotation> matontoAnnotations = owlapiAnnotations.stream()
		        .map(Values::matontoAnnotation)
		        .collect(Collectors.toSet());
			
		return new SimpleDeclarationAxiom(matontoEntity, matontoAnnotations);
	}
	
	public static OWLDeclarationAxiom owlapiDeclarationAxiom(DeclarationAxiom matontoAxiom)
	{
		Entity matontoEntity = matontoAxiom.getEntity();
		OWLEntity owlapiEntity;
		switch(matontoEntity.getEntityType().getName()) {
			case "Class":
				owlapiEntity = owlapiClass((OClass) matontoEntity);
				break;
			
			case "ObjectProperty":
				owlapiEntity = owlapiObjectProperty((ObjectProperty) matontoEntity);
				break;
				
			case "DataProperty":
				owlapiEntity = owlapiDataProperty((DataProperty) matontoEntity);
				break;
				
			case "AnnotationProperty":
				owlapiEntity = owlapiAnnotationProperty((AnnotationProperty) matontoEntity);
				break;
				
			case "NamedIndividual":
				owlapiEntity = owlapiNamedIndividual((NamedIndividual) matontoEntity);
				break;
				
			case "Datatype":
				owlapiEntity = owlapiDatatype((Datatype) matontoEntity);	
				break;
				
            default:
                return null;
		}
		
		Set<Annotation> matontoAnnotations = matontoAxiom.getAnnotations();
		Set<OWLAnnotation> owlapiAnnotations = matontoAnnotations.stream()
		        .map(Values::owlapiAnnotation)
		        .collect(Collectors.toSet());
			
		return new OWLDeclarationAxiomImpl(owlapiEntity, owlapiAnnotations);
	}
}
