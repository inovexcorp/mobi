grammar MOS ;
import Tokens;

description
    : conjunction (OR_LABEL conjunction)*
    ;

conjunction
    : primary (AND_LABEL primary)*
    | classIRI THAT_LABEL primary (AND_LABEL primary)*
    ;

primary
    : (NOT_LABEL)? (restriction | atomic)
    ;

iri
    : FULL_IRI
    | ABBREVIATED_IRI
    | SIMPLE_IRI
    ;

objectPropertyExpression
    : objectPropertyIRI
    | inverseObjectProperty
    ;

restriction
    : objectPropertyExpression SOME_LABEL primary
    | objectPropertyExpression ONLY_LABEL primary
    | objectPropertyExpression VALUE_LABEL individual
    | objectPropertyExpression SELF_LABEL
    | objectPropertyExpression MIN_LABEL nonNegativeInteger (primary)?
    | objectPropertyExpression MAX_LABEL nonNegativeInteger (primary)?
    | objectPropertyExpression EXACTLY_LABEL nonNegativeInteger (primary)?
    | dataPropertyExpression SOME_LABEL dataPrimary
    | dataPropertyExpression ONLY_LABEL dataPrimary
    | dataPropertyExpression VALUE_LABEL literal
    | dataPropertyExpression MIN_LABEL nonNegativeInteger (dataPrimary)?
    | dataPropertyExpression MAX_LABEL nonNegativeInteger (dataPrimary)?
    | dataPropertyExpression EXACTLY_LABEL nonNegativeInteger (dataPrimary)?
    ;

atomic
    : classIRI
    | OPEN_CURLY_BRACE individualList CLOSE_CURLY_BRACE
    | OPEN_BRACE description CLOSE_BRACE
    ;

classIRI
    : iri
    ;

individualList
    : individual (COMMA individual)*
    ;

individual
    : individualIRI
    | NODE_ID
    ;

nonNegativeInteger
    : DIGITS
    ;

dataPrimary
    : NOT_LABEL? dataAtomic
    ;

dataAtomic
    : dataType
    | OPEN_CURLY_BRACE literalList CLOSE_CURLY_BRACE
    | dataTypeRestriction
    | OPEN_BRACE dataRange CLOSE_BRACE
    ;

literalList
    : literal (COMMA literal)*
    ;

dataType
    : datatypeIRI
    | INTEGER_LABEL
    | DECIMAL_LABEL
    | FLOAT_LABEL
    | STRING_LABEL
    ;

literal
    : typedLiteral
    | stringLiteralNoLanguage
    | stringLiteralWithLanguage
    | integerLiteral
    | decimalLiteral
    | floatingPointLiteral
    ;

typedLiteral
    : lexicalValue REFERENCE dataType
    ;

stringLiteralNoLanguage
    : QUOTED_STRING
    ;

stringLiteralWithLanguage
    : QUOTED_STRING LANGUAGE_TAG
    ;

lexicalValue
    : QUOTED_STRING
    ;

dataPropertyExpression
    : dataPropertyIRI
    ;

dataTypeRestriction
    : dataType OPEN_SQUARE_BRACE facet restrictionValue  (COMMA facet restrictionValue)* CLOSE_SQUARE_BRACE
    ;

facet
    : LENGTH_LABEL
    | MIN_LENGTH_LABEL
    | MAX_LENGTH_LABEL
    | PATTERN_LABEL
    | LANG_PATTERN_LABEL
    | LESS_EQUAL
    | LESS
    | GREATER_EQUAL
    | GREATER
    ;

restrictionValue
    : literal
    ;

inverseObjectProperty
    : INVERSE_LABEL objectPropertyIRI
    ;

decimalLiteral
    : (PLUS | MINUS)? DIGITS DOT DIGITS
    ;

integerLiteral
    : (PLUS | MINUS)? DIGITS
    ;

floatingPointLiteral
    : (PLUS | MINUS)? ((DIGITS (DOT DIGITS)? EXPONENT?) | DOT DIGITS EXPONENT?) (LOWER_FLOAT_SUFFIX | UPPER_FLOAT_SUFFIX)
    ;

dataRange
    : dataConjunction (OR_LABEL dataConjunction)*
    ;

dataConjunction
    : dataPrimary (AND_LABEL dataPrimary)*
    ;

annotationAnnotatedList
    : annotations? annotation (COMMA annotations? annotation)*
    ;

annotation
    : annotationPropertyIRI annotationTarget
    ;

annotationTarget
    : NODE_ID
    | iri
    | literal
    ;

annotations
    : ANNOTATIONS_LABEL annotationAnnotatedList
    ;

descriptionAnnotatedList
    : annotations? description (COMMA descriptionAnnotatedList)*
    ;

description2List
    : description COMMA descriptionList
    ;

descriptionList
    : description (COMMA description)*
    ;

classFrame
    : CLASS_LABEL classIRI
    (    ANNOTATIONS_LABEL annotationAnnotatedList
        |    SUBCLASS_OF_LABEL descriptionAnnotatedList
        |    EQUIVALENT_TO_LABEL descriptionAnnotatedList
        |    DISJOINT_WITH_LABEL descriptionAnnotatedList
        |    DISJOINT_UNION_OF_LABEL annotations description2List
    )*
    //TODO owl2 primer error?
    (    HAS_KEY_LABEL annotations?
            (objectPropertyExpression | dataPropertyExpression)+)?
    ;

objectPropertyFrame
    : OBJECT_PROPERTY_LABEL objectPropertyIRI
    (    ANNOTATIONS_LABEL annotationAnnotatedList
        |    RANGE_LABEL descriptionAnnotatedList
        |    CHARACTERISTICS_LABEL objectPropertyCharacteristicAnnotatedList
        |    SUB_PROPERTY_OF_LABEL objectPropertyExpressionAnnotatedList
        |    EQUIVALENT_TO_LABEL objectPropertyExpressionAnnotatedList
        |    DISJOINT_WITH_LABEL objectPropertyExpressionAnnotatedList
        |    INVERSE_OF_LABEL objectPropertyExpressionAnnotatedList
        |    SUB_PROPERTY_CHAIN_LABEL annotations objectPropertyExpression (O_LABEL objectPropertyExpression)+
        )*
    ;

objectPropertyCharacteristicAnnotatedList
    : annotations? OBJECT_PROPERTY_CHARACTERISTIC (COMMA objectPropertyCharacteristicAnnotatedList)*
    ;

objectPropertyExpressionAnnotatedList
    : annotations? objectPropertyExpression (COMMA objectPropertyExpressionAnnotatedList)*
    ;

dataPropertyFrame
    : DATA_PROPERTY_LABEL  dataPropertyIRI
    (    ANNOTATIONS_LABEL annotationAnnotatedList
    |    DOMAIN_LABEL  descriptionAnnotatedList
    |    RANGE_LABEL  dataRangeAnnotatedList
    |    CHARACTERISTICS_LABEL  annotations FUNCTIONAL_LABEL
    |    SUB_PROPERTY_OF_LABEL  dataPropertyExpressionAnnotatedList
    |    EQUIVALENT_TO_LABEL  dataPropertyExpressionAnnotatedList
    |    DISJOINT_WITH_LABEL  dataPropertyExpressionAnnotatedList
    )*
    ;

dataRangeAnnotatedList
    : annotations? dataRange (COMMA dataRangeAnnotatedList)*
    ;

dataPropertyExpressionAnnotatedList
    : annotations? dataPropertyExpression (COMMA dataPropertyExpressionAnnotatedList)*
    ;

annotationPropertyFrame
    : ANNOTATION_PROPERTY_LABEL annotationPropertyIRI
    (    ANNOTATIONS_LABEL  annotationAnnotatedList )*
    |    DOMAIN_LABEL  iriAnnotatedList
    |    RANGE_LABEL  iriAnnotatedList
    |    SUB_PROPERTY_OF_LABEL annotationPropertyIRIAnnotatedList
    ;

iriAnnotatedList
    : annotations? iri (COMMA iriAnnotatedList)*
    ;

annotationPropertyIRI
    : iri
    ;

annotationPropertyIRIAnnotatedList
    : annotations? annotationPropertyIRI (COMMA annotationPropertyIRIAnnotatedList)*
    ;

individualFrame
    : INDIVIDUAL_LABEL  individual
    (    ANNOTATIONS_LABEL  annotationAnnotatedList
        |    TYPES_LABEL  descriptionAnnotatedList
        |    FACTS_LABEL  factAnnotatedList
        |    SAME_AS_LABEL  individualAnnotatedList
        |    DIFFERENET_FROM_LABEL  individualAnnotatedList
    )*
    ;

factAnnotatedList
    : annotations? fact (COMMA factAnnotatedList)*
    ;

individualAnnotatedList
    : annotations? individual (COMMA individualAnnotatedList)*
    ;

fact
    : NOT_LABEL? (objectPropertyFact | dataPropertyFact)
    ;

objectPropertyFact
    : objectPropertyIRI individual
    ;

dataPropertyFact
    : dataPropertyIRI literal
    ;

datatypeFrame
    : DATATYPE_LABEL  dataType
        (ANNOTATIONS_LABEL  annotationAnnotatedList)*
        (EQUIVALENT_TO_LABEL  annotations dataRange)?
        (ANNOTATIONS_LABEL  annotationAnnotatedList)*
    ;

misc
	: EQUIVALENT_CLASSES_LABEL  annotations description2List
    |    DISJOINT_CLASSES_LABEL  annotations description2List
    |    EQUIVALENT_PROPERTIES_LABEL  annotations objectProperty2List
    |    DISJOINT_PROPERTIES_LABEL  annotations objectProperty2List
    |    EQUIVALENT_PROPERTIES_LABEL  annotations dataProperty2List
    |    DISJOINT_PROPERTIES_LABEL  annotations dataProperty2List
    |    SAME_INDIVIDUAL_LABEL  annotations individual2List
    |    DIFFERENT_INDIVIDUALS_LABEL  annotations individual2List
    ;

individual2List
    : individual COMMA individualList
    ;

dataProperty2List
    : dataProperty COMMA dataPropertyList
    ;

dataPropertyList
    : dataProperty (COMMA dataProperty)*
    ;

objectProperty2List
    : objectProperty COMMA objectPropertyList
    ;

objectPropertyList
    : objectProperty (COMMA objectProperty)*
    ;

objectProperty
    : objectPropertyIRI
    ;

dataProperty
    : dataPropertyIRI
    ;

dataPropertyIRI
    : iri
    ;

datatypeIRI
    : iri
    ;

objectPropertyIRI
    : iri
    ;

frame
    : datatypeFrame
    | classFrame
    | objectPropertyFrame
    | dataPropertyFrame
    | annotationPropertyFrame
    | individualFrame
    | misc
    ;

entity
    : DATATYPE_LABEL OPEN_BRACE dataType CLOSE_BRACE
    | CLASS_LABEL OPEN_BRACE classIRI CLOSE_BRACE
    | OBJECT_PROPERTY_LABEL OPEN_BRACE objectPropertyIRI CLOSE_BRACE
    | DATA_PROPERTY_LABEL OPEN_BRACE datatypePropertyIRI CLOSE_BRACE
    | ANNOTATION_PROPERTY_LABEL OPEN_BRACE annotationPropertyIRI CLOSE_BRACE
    | NAMED_INDIVIDUAL_LABEL OPEN_BRACE individualIRI CLOSE_BRACE
    ;

individualIRI
    : iri
    ;

datatypePropertyIRI
    : iri
    ;

ontologyDocument
    : prefixDeclaration* ontology
    ;

prefixDeclaration
    : PREFIX_LABEL PREFIX_NAME FULL_IRI
    ;

ontology
    : ONTOLOGY_LABEL (ontologyIri (versionIri)?)? imports* annotations* frame*
    ;

ontologyIri
    : iri
    ;

versionIri
    : iri
    ;

imports
	: IMPORT_LABEL iri
	;