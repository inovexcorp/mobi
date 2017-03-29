grammar Sparql;

// SPARQL is case-insensitive with the exception of 'a' (rdf:type) and escape sequences. Since all of these
// cases refer to lower-case characters, it should be safe to use this grammar with a CaseInsensitiveInputStream

query
    : prologue ( selectQuery | constructQuery | describeQuery | askQuery ) EOF
    ;

prologue
    : baseDecl? prefixDecl*
    ;

baseDecl
    : 'base' IRI_REF
    ;

prefixDecl
    : 'prefix' PNAME_NS IRI_REF
    ;

selectQuery
    : 'select' ( 'distinct' | 'reduced' )? ( var+ | '*' ) datasetClause* whereClause solutionModifier
    ;

constructQuery
    : 'construct' constructTemplate datasetClause* whereClause solutionModifier
    ;

describeQuery
    : 'describe' ( varOrIRIref+ | '*' ) datasetClause* whereClause? solutionModifier
    ;

askQuery
    : 'ask' datasetClause* whereClause
    ;

datasetClause
    : 'from' ( defaultGraphClause | namedGraphClause )
    ;

defaultGraphClause
    : sourceSelector
    ;

namedGraphClause
    : 'named' sourceSelector
    ;

sourceSelector
    : iriRef
    ;

whereClause
    : 'where'? groupGraphPattern
    ;

solutionModifier
    : orderClause? limitOffsetClauses?
    ;

limitOffsetClauses
    : ( limitClause offsetClause? | offsetClause limitClause? )
    ;

orderClause
    : 'order' 'by' orderCondition+
    ;

orderCondition
    : ( ( 'asc' | 'desc' ) brackettedExpression )
    | ( constraint | var )
    ;

limitClause
    : 'limit' INTEGER
    ;

offsetClause
    : 'offset' INTEGER
    ;

groupGraphPattern
    : '{' triplesBlock? ( ( graphPatternNotTriples | filter ) '.'? triplesBlock? )* '}'
    ;

triplesBlock
    : triplesSameSubject ( '.' triplesBlock? )?
    ;

graphPatternNotTriples
    : optionalGraphPattern | groupOrUnionGraphPattern | graphGraphPattern
    ;

optionalGraphPattern
    : 'optional' groupGraphPattern
    ;

graphGraphPattern
    : 'graph' varOrIRIref groupGraphPattern
    ;

groupOrUnionGraphPattern
    : groupGraphPattern ( 'union' groupGraphPattern )*
    ;

filter
    : 'filter' constraint
    ;

constraint
    : brackettedExpression | builtInCall | functionCall
    ;

functionCall
    : iriRef argList
    ;

argList
    : ( NIL | '(' expression ( ',' expression )* ')' )
    ;

constructTemplate
    : '{' constructTriples? '}'
    ;

constructTriples
    : triplesSameSubject ( '.' constructTriples? )?
    ;

triplesSameSubject
    : varOrTerm propertyListNotEmpty | triplesNode propertyList
    ;

propertyListNotEmpty
    : verb objectList ( ';' ( verb objectList )? )*
    ;

propertyList
    : propertyListNotEmpty?
    ;

objectList
    : object ( ',' object )*
    ;

object
    : graphNode
    ;

verb
    : varOrIRIref
    | 'a'
    ;

triplesNode
    : collection
    | blankNodePropertyList
    ;

blankNodePropertyList
    : '[' propertyListNotEmpty ']'
    ;

collection
    : '(' graphNode+ ')'
    ;

graphNode
    : varOrTerm | triplesNode
    ;

varOrTerm
    : var
    | graphTerm
    ;

varOrIRIref
    : var | iriRef
    ;

var
    : VAR1
    | VAR2
    ;

graphTerm
    : iriRef
    | rdfLiteral
    | numericLiteral
    | booleanLiteral
    | blankNode
    | NIL
    ;

expression
    : conditionalOrExpression
    ;

conditionalOrExpression
    : conditionalAndExpression ( '||' conditionalAndExpression )*
    ;

conditionalAndExpression
    : valueLogical ( '&&' valueLogical )*
    ;

valueLogical
    : relationalExpression
    ;

relationalExpression
    : numericExpression ( '=' numericExpression | '!=' numericExpression | '<' numericExpression | '>' numericExpression | '<=' numericExpression | '>=' numericExpression )?
    ;

numericExpression
    : additiveExpression
    ;

additiveExpression
    : multiplicativeExpression ( '+' multiplicativeExpression | '-' multiplicativeExpression | numericLiteralPositive | numericLiteralNegative )*
    ;

multiplicativeExpression
    : unaryExpression ( '*' unaryExpression | '/' unaryExpression )*
    ;

unaryExpression
    :  '!' primaryExpression
    | '+' primaryExpression
    | '-' primaryExpression
    | primaryExpression
    ;

primaryExpression
    : brackettedExpression | builtInCall | iriRefOrFunction | rdfLiteral | numericLiteral | booleanLiteral | var
    ;

brackettedExpression
    : '(' expression ')'
    ;

builtInCall
    : 'str' '(' expression ')'
    | 'lang' '(' expression ')'
    | 'langmatches' '(' expression ',' expression ')'
    | 'datatype' '(' expression ')'
    | 'bound' '(' var ')'
    | 'sameterm' '(' expression ',' expression ')'
    | 'isiri' '(' expression ')'
    | 'isuri' '(' expression ')'
    | 'isblank' '(' expression ')'
    | 'isliteral' '(' expression ')'
    | regexExpression
    ;

regexExpression
    : 'regex' '(' expression ',' expression ( ',' expression )? ')'
    ;

iriRefOrFunction
    : iriRef argList?
    ;

rdfLiteral
    : string ( LANGTAG | ( '^^' iriRef ) )?
    ;

numericLiteral
    : numericLiteralUnsigned | numericLiteralPositive | numericLiteralNegative
    ;

numericLiteralUnsigned
    : INTEGER
    | DECIMAL
    | DOUBLE
    ;

numericLiteralPositive
    : INTEGER_POSITIVE
    | DECIMAL_POSITIVE
    | DOUBLE_POSITIVE
    ;

numericLiteralNegative
    : INTEGER_NEGATIVE
    | DECIMAL_NEGATIVE
    | DOUBLE_NEGATIVE
    ;

booleanLiteral
    : 'true'
    | 'false'
    ;

string
    : STRING_LITERAL1
    | STRING_LITERAL2
    /* | STRING_LITERAL_LONG('0'..'9') | STRING_LITERAL_LONG('0'..'9')*/
    ;

iriRef
    : IRI_REF
    | prefixedName
    ;

prefixedName
    : PNAME_LN
    | PNAME_NS
    ;

blankNode
    : BLANK_NODE_LABEL
    | ANON
    ;

// LEXER RULES

IRI_REF
    : '<' ( ~('<' | '>' | '"' | '{' | '}' | '|' | '^' | '\\' | '`') | (PN_CHARS))* '>'
    ;

PNAME_NS
    : PN_PREFIX? ':'
    ;

PNAME_LN
    : PNAME_NS PN_LOCAL
    ;

BLANK_NODE_LABEL
    : '_:' PN_LOCAL
    ;

VAR1
    : '?' VARNAME
    ;

VAR2
    : '$' VARNAME
    ;

LANGTAG
    : '@' PN_CHARS_BASE+ ('-' (PN_CHARS_BASE DIGIT)+)*
    ;

INTEGER
    : DIGIT+
    ;

DECIMAL
    : DIGIT+ '.' DIGIT*
    | '.' DIGIT+
    ;

DOUBLE
    : DIGIT+ '.' DIGIT* EXPONENT
    | '.' DIGIT+ EXPONENT
    | DIGIT+ EXPONENT
    ;

INTEGER_POSITIVE
    : '+' INTEGER
    ;

DECIMAL_POSITIVE
    : '+' DECIMAL
    ;

DOUBLE_POSITIVE
    : '+' DOUBLE
    ;

INTEGER_NEGATIVE
    : '-' INTEGER
    ;

DECIMAL_NEGATIVE
    : '-' DECIMAL
    ;

DOUBLE_NEGATIVE
    : '-' DOUBLE
    ;

EXPONENT
    : ('e'|'E') ('+'|'-')? DIGIT+
    ;

STRING_LITERAL1
    : '\'' ( ~('\u0027' | '\u005C' | '\u000A' | '\u000D') | ECHAR )* '\''
    ;

STRING_LITERAL2
    : '"'  ( ~('\u0022' | '\u005C' | '\u000A' | '\u000D') | ECHAR )* '"'
    ;

STRING_LITERAL_LONG1
    : '\'\'\'' ( ( '\'' | '\'\'' )? (~('\'' | '\\') | ECHAR ) )* '\'\'\''
    ;

STRING_LITERAL_LONG2
    : '"""' ( ( '"' | '""' )? ( ~('\'' | '\\') | ECHAR ) )* '"""'
    ;

ECHAR
    : '\\' ('t' | 'b' | 'n' | 'r' | 'f' | '"' | '\'')
    ;

NIL
    : '(' WS* ')'
    ;

ANON
    : '[' WS* ']'
    ;

PN_CHARS_U
    : PN_CHARS_BASE | '_'
    ;

VARNAME
    : ( PN_CHARS_U | DIGIT ) ( PN_CHARS_U | DIGIT | '\u00B7' | ('\u0300'..'\u036F') | ('\u203F'..'\u2040') )*
    ;

fragment
PN_CHARS
    : PN_CHARS_U
    | '-'
    | DIGIT
    /*| '\u00B7'
    | '\u0300'..'\u036F'
    | '\u203F'..'\u2040'*/
    ;

PN_PREFIX
    : PN_CHARS_BASE ((PN_CHARS|'.')* PN_CHARS)?
    ;

PN_LOCAL
    : ( PN_CHARS_U | DIGIT ) ((PN_CHARS|'.')* PN_CHARS)?
    ;

fragment
PN_CHARS_BASE
    : 'A'..'Z'
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

fragment
DIGIT
    : '0'..'9'
    ;

WS
    : (' '
    | '\t'
    | '\n'
    | '\r')+ ->channel(HIDDEN)
    ;
