package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.model.EntityType;

public enum SimpleEntityType {
	
	CLASS("Class", "Class", "Classes"),
	OBJECT_PROPERTY("ObjectProperty", "Object property", "Object properties"),
	DATA_PROPERTY("DataProperty","Data property", "Data properties"),
	ANNOTATION_PROPERTY("AnnotationProperty", "Annotation property", "Annotation properties"),
	NAMED_INDIVIDUAL("NamedIndividual", "Named individual", "Named individuals"),
	DATATYPE("Datatype", "Datatype", "Datatypes");
	
	private final String name;
	private final String printName;
	private final String pluralPrintName;
	
	private SimpleEntityType(String name, String printName, String pluralPrintName)
	{
		this.name = name;
		this.printName = printName;
		this.pluralPrintName = pluralPrintName;
	}
	
	public String getName()
	{
		return name;
	}
	
	public String getPrintName()
	{
		return printName;
	}
	
	public String getPluralPrintName()
	{
		return pluralPrintName;
	}
	
	public String getPrefixedName()
	{
		return owlapiEntityType(this).getPrefixedName();
	}
	
	
	public OntologyIRI getIRI()
	{
		return SimpleIRI.matontoIRI(owlapiEntityType(this).getIRI());
	}
	
	
	public static SimpleEntityType matontoEntityType(EntityType<?> entityType)
	{
		return SimpleEntityType.valueOf(entityType.getName());
	}
	
	public static EntityType<?> owlapiEntityType(SimpleEntityType simpleEntityType)
	{
		EntityType<?> entityType = null;
		
		switch(simpleEntityType.getName()) 
		{
			case "Class":
				return EntityType.CLASS;
			
			case "ObjectProperty":
				return EntityType.OBJECT_PROPERTY;
				
			case "DataProperty":
				return EntityType.DATA_PROPERTY;
				
			case "AnnotationProperty":
				return EntityType.ANNOTATION_PROPERTY;
				
			case "NamedIndividual":
				return EntityType.NAMED_INDIVIDUAL;
				
			case "Datatype":
				return EntityType.DATATYPE;						
		}
		
		return entityType;
	}
	
}
