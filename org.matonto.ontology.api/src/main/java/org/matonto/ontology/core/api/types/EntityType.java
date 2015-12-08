package org.matonto.ontology.core.api.types;

public enum EntityType {
	
	CLASS("Class", "Class", "Classes"),
	OBJECT_PROPERTY("ObjectProperty", "Object property", "Object properties"),
	DATA_PROPERTY("DataProperty","Data property", "Data properties"),
	ANNOTATION_PROPERTY("AnnotationProperty", "Annotation property", "Annotation properties"),
	NAMED_INDIVIDUAL("NamedIndividual", "Named individual", "Named individuals"),
	DATATYPE("Datatype", "Datatype", "Datatypes");
	
	private final String name;
	private final String printName;
	private final String pluralPrintName;
	
	EntityType(String name, String printName, String pluralPrintName) {
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
	
//	public String getPrefixedName()
//	{
//	}
//
//	public OntologyIRI getIRI()
//	{
//		return SimpleIRI.matontoIRI(owlapiEntityType(this).getIRI());
//	}
}
