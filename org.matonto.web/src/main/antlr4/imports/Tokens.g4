lexer grammar Tokens;

LOWER_FLOAT_SUFFIX: 'f';

UPPER_FLOAT_SUFFIX: 'F';

O_LABEL: 'o';

LENGTH_LABEL: 'length';

MIN_LENGTH_LABEL: 'minLength';

MAX_LENGTH_LABEL: 'maxLength';

PATTERN_LABEL: 'pattern';

LANG_PATTERN_LABEL: 'langPattern';

THAT_LABEL: 'that';

INVERSE_LABEL: 'inverse';

MINUS: '-';

DOT: '.';

PLUS: '+';

DIGITS: ('0'..'9')+;

NOT_LABEL: 'not';

WS: [ \t\r\n\f]+ -> channel(HIDDEN) ;

LESS_EQUAL: '<=';

GREATER_EQUAL: '>=';

LESS: '<';

GREATER: '>';

OPEN_CURLY_BRACE: '{';

CLOSE_CURLY_BRACE: '}';

OR_LABEL: 'or';

AND_LABEL: 'and';

SOME_LABEL: 'some';

ONLY_LABEL: 'only';

VALUE_LABEL: 'value';

SELF_LABEL:	'Self';

MIN_LABEL: 'min';

MAX_LABEL: 'max';

EXACTLY_LABEL: 'exactly';

COMMA: ',';

OPEN_BRACE: '(';

CLOSE_BRACE:')';

INTEGER_LABEL: 'integer';

DECIMAL_LABEL: 'decimal';

FLOAT_LABEL: 'float';

STRING_LABEL: 'string';

REFERENCE: '^^';

RANGE_LABEL: 'Range:';

CHARACTERISTICS_LABEL: 'Characteristics:';

SUB_PROPERTY_OF_LABEL: 'SubPropertyOf:';

SUB_PROPERTY_CHAIN_LABEL: 'SubPropertyChain:';

OBJECT_PROPERTY_LABEL: 'ObjectProperty:';

DATA_PROPERTY_LABEL: 'DataProperty:';

ANNOTATION_PROPERTY_LABEL: 'AnnotaionProperty:';

NAMED_INDIVIDUAL_LABEL: 'NamedIndividual';

PREFIX_LABEL: 'Prefix:';

ONTOLOGY_LABEL: 'Ontology:';

INDIVIDUAL_LABEL: 'Individual:';

TYPES_LABEL: 'Types:';

FACTS_LABEL: 'Facts:';

SAME_AS_LABEL: 'SameAs:';

DIFFERENET_FROM_LABEL: 'DifferentFrom:';

DATATYPE_LABEL: 'Datatype:';

EQUIVALENT_CLASSES_LABEL: 'EquivalentClasses:';

DISJOINT_CLASSES_LABEL: 'DisjointClasses:';

EQUIVALENT_PROPERTIES_LABEL: 'EquivalentProperties:';

DISJOINT_PROPERTIES_LABEL: 'DisjointProperties:';

SAME_INDIVIDUAL_LABEL: 'SameIndividual:';

DIFFERENT_INDIVIDUALS_LABEL: 'DifferentIndividuals:';

EQUIVALENT_TO_LABEL: 'EquivalentTo:';

SUBCLASS_OF_LABEL: 'SubClassOf:';

DISJOINT_WITH_LABEL: 'DisjointWith:';

DISJOINT_UNION_OF_LABEL: 'DisjointUnioniOf:';

HAS_KEY_LABEL: 'HasKey:';

INVERSE_OF_LABEL: 'InverseOf:';

IMPORT_LABEL: 'Import:';

ANNOTATIONS_LABEL: 'Annotations:';

CLASS_LABEL: 'Class:';

OBJECT_PROPERTY_CHARACTERISTIC:	FUNCTIONAL_LABEL | INVERSE_FUNCTIONAL_LABEL | REFLEXIVE_LABEL | IRREFLEXIVE_LABEL | SYMMETRIC_LABEL | ASSYMETRIC_LABEL | TRANSITIVE_LABEL;

fragment FUNCTIONAL_LABEL: 'Functional';

fragment INVERSE_FUNCTIONAL_LABEL: 'InverseFunctional';

fragment REFLEXIVE_LABEL: 'Reflexive';

fragment IRREFLEXIVE_LABEL: 'Irreflexive';

fragment SYMMETRIC_LABEL: 'Symmetric';

fragment ASSYMETRIC_LABEL: 'Assymentric';

fragment TRANSITIVE_LABEL:'Transitive';

fragment DOMAIN_LABEL: 'Domain:';

fragment PN_PREFIX: (PN_CHARS)*;

fragment EOL: '\n' | '\r';

fragment PN_CHARS_BASE:
	'A'..'Z'
    | 'a'..'z'
    | '\u00C0'..'\u00D6'
    | '\u00D8'..'\u00F6'
    | '\u00F8'..'\u02FF'
    | '\u0370'..'\u037D'
    | '\u037F'..'\u1FFF'
    | '\u200C'..'\u200D'
    | '\u2070'..'\u218F'
    | '\u2C00'..'\u2FEF'
    | '\u3001'..'\uD7FF'
    | '\uF900'..'\uFDCF'
    | '\uFDF0'..'\uFFFD'
    ;

fragment PN_CHARS_U: PN_CHARS_BASE | '_';

FULL_IRI: LESS ~('<' | '>' | '"' | '{' | '}' | '|' | '^' | '\\' | '`' | ['\u0000'-'\u0020'])*? GREATER;

NODE_ID: '_:' t=SIMPLE_IRI;

fragment PN_CHARS
    : PN_CHARS_U
    | MINUS
    | DIGITS
    | '\u00B7'
    | '\u0300'..'\u036F'
    | '\u203F'..'\u2040'
    ;

OPEN_SQUARE_BRACE: '[';

CLOSE_SQUARE_BRACE: ']';

QUOTED_STRING: '"' ( ~('\u0022' | '\u005C' | '\u000A' | '\u000D') | ECHAR )*? '"';

fragment ECHAR: '\\' ('t' | 'b' | 'n' | 'r' | 'f' | '\\' | '"' | '\'');

LANGUAGE_TAG: '@' (('a'..'z')|('A'..'Z'))+ (MINUS (('a'..'z')('A'..'Z')DIGITS)+)*
    ;

EXPONENT: ('e'|'E') (PLUS | MINUS)? DIGITS;

PREFIX_NAME: PN_PREFIX ':';

ABBREVIATED_IRI: PREFIX_NAME SIMPLE_IRI;

SIMPLE_IRI: (PN_CHARS_U) (DOT? PN_CHARS)*;