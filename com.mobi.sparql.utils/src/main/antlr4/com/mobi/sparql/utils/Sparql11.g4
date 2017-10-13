grammar Sparql11;

// SPARQL is case-insensitive with the exception of 'a' (rdf:type) and escape sequences. Since all of these
// cases refer to lower-case characters, it should be safe to use this grammar with a CaseInsensitiveInputStream

options{
    language = Java;
}

/* sparql 1.1 r1 */

queryUnit
  :
  query
  ;

/* sparql 1.1 r2 */

query
  :
  prologue
  (
    selectQuery
    | constructQuery
    | describeQuery
    | askQuery
  )
  valuesClause
  ;

/* sparql 1.1 r3 */

updateUnit
  :
  update
  ;

/* sparql 1.1 r4 */
prologue
  :
  (
    baseDecl | prefixDecl
  )*
  ;

/* sparql 1.1 r5 */

baseDecl
  :
  'base' IRI_REF
  ;

/* sparql 1.1 r6 */

prefixDecl
  :
  'prefix' PNAME_NS IRI_REF
  ;

/* sparql 1.1 r7 */

selectQuery
  :
  selectClause datasetClause* whereClause solutionModifier
  ;

/* sparql 1.1 r8 */

subSelect
  :
  selectClause whereClause solutionModifier valuesClause
  ;

/* sparql 1.1 r9 */

selectClause
  :
  'select'
  (
    'distinct'
    | 'reduced'
  )?
  (
    (
      var
      | (
        OPEN_BRACE expression 'as' var CLOSE_BRACE
      )
    )+
    | ASTERISK
  )
  ;

/* sparql 1.1 r10 */

constructQuery
  :
  'construct'
  (
    constructTemplate datasetClause* whereClause solutionModifier
    | datasetClause* 'where' OPEN_CURLY_BRACE triplesTemplate? CLOSE_CURLY_BRACE solutionModifier
  )
  ;

/* sparql 1.1 r11 */

describeQuery
  :
  'describe'
  (
    varOrIriRef+
    | ASTERISK
  )
  datasetClause* whereClause? solutionModifier
  ;

/* sparql 1.1 r12 */

askQuery
  :
  'ask' datasetClause* whereClause solutionModifier
  ;

/* sparql 1.1 r13 */

datasetClause
  :
  'from'
  (
    defaultGraphClause
    | namedGraphClause
  )
  ;

/* sparql 1.1 r14 */

defaultGraphClause
  :
  sourceSelector
  ;

/* sparql 1.1 r15 */

namedGraphClause
  :
  'named' sourceSelector
  ;

/* sparql 1.1 r16 */

sourceSelector
  :
  iriRef
  ;

/* sparql 1.1 r17 */

whereClause
  :
  'where'? groupGraphPattern
  ;

/* sparql 1.1 r18 */

solutionModifier
  :
  groupClause? havingClause? orderClause? limitOffsetClauses?
  ;

/* sparql 1.1 r19 */

groupClause
  :
  'group' 'by' groupCondition+
  ;

/* sparql 1.1 r20 */

groupCondition
  :
  builtInCall
  | functionCall
  | OPEN_BRACE expression ('as' var)? CLOSE_BRACE
  | var
  ;

/* sparql 1.1 r21 */

havingClause
  :
  'having' havingCondition+
  ;

/* sparql 1.1 r22 */

havingCondition
  :
  constraint
  ;

/* sparql 1.1 r23 */

orderClause
  :
  'order' 'by' orderCondition+
  ;

/* sparql 1.1 r24 */

orderCondition
  :
  (
    (
      'asc'
      | 'desc'
    )
    brackettedExpression
  )
  |
  (
    constraint
    | var
  )
  ;

/* sparql 1.1 r25 */

limitOffsetClauses
  :
  (limitClause offsetClause?
  | offsetClause limitClause?)
  ;

/* sparql 1.1 r26 */

limitClause
  :
  'limit' INTEGER
  ;

/* sparql 1.1 r27 */

offsetClause
  :
  'offset' INTEGER
  ;

/* sparql 1.1 r28 */

valuesClause
  :
  (
    'values' dataBlock
  )?
  ;

/* sparql 1.1 r29 */

update
  :
  prologue
  (
    update1
    (
      SEMICOLON update
    )?
  )?
  ;

/* sparql 1.1 r30 */

update1
  :
  load
  | clear
  | drop
  | add
  | move
  | copy
  | create
  | insertData
  | deleteData
  | deleteWhere
  | modify
  ;

/* sparql 1.1 r31 */

load
  :
  'load' 'silent'? iriRef ('into' graphRef)?
  ;

/* sparql 1.1 r32 */

clear
  :
  'clear' 'silent'? graphRefAll
  ;

/* sparql 1.1 r33 */

drop
  :
  'drop' 'silent'? graphRefAll
  ;

/* sparql 1.1 r34 */

create
  :
  'create' 'silent'? graphRef
  ;

/* sparql 1.1 r35 */

add
  :
  'add' 'silent'? graphOrDefault 'to' graphOrDefault
  ;

/* sparql 1.1 r36 */

move
  :
  'move' 'silent'? graphOrDefault 'to' graphOrDefault
  ;

/* sparql 1.1 r37 */

copy
  :
  'copy' 'silent'? graphOrDefault 'to' graphOrDefault
  ;

/* sparql 1.1 r38 */

insertData
  :
  'insert data' quadData
  ;

/* sparql 1.1 r39 */

deleteData
  :
  'delete data' quadData
  ;

/* sparql 1.1 r40 */

deleteWhere
  :
  'delete where' quadPattern
  ;

/* sparql 1.1 r41 */

modify
  :
  ('with' iriRef)?
  (
    deleteClause insertClause?
    | insertClause
  )
  usingClause* 'where' groupGraphPattern
  ;

/* sparql 1.1 r42 */

deleteClause
  :
  'delete' quadPattern
  ;

/* sparql 1.1 r43 */

insertClause
  :
  'insert' quadPattern
  ;

/* sparql 1.1 r44 */

usingClause
  :
  'using'
  (
    iriRef
    | 'named' iriRef
  )
  ;

/* sparql 1.1 r45 */

graphOrDefault
  :
  'default' | 'graph'? iriRef
  ;

/* sparql 1.1 r46 */

graphRef
  :
  'graph'
  | iriRef
  ;

/* sparql 1.1 r47 */

graphRefAll
  :
  graphRef
  | 'default'
  | 'named'
  | 'all'
  ;

/* sparql 1.1 r48 */

quadPattern
  :
  OPEN_CURLY_BRACE quads CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r49 */

quadData
  :
  OPEN_CURLY_BRACE quads CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r50 */

quads
  :
  triplesTemplate? (quadsNotTriples DOT? triplesTemplate?)*
  ;

/* sparql 1.1 r51 */

quadsNotTriples
  :
  'graph' varOrIriRef OPEN_CURLY_BRACE triplesTemplate? CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r52 */

triplesTemplate
  :
  triplesSameSubject (DOT triplesTemplate?)?
  ;

/* sparql 1.1 r53 */

groupGraphPattern
  :
  OPEN_CURLY_BRACE
  (
    subSelect
    | groupGraphPatternSub
  )
  CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r54 */

groupGraphPatternSub
  :
  triplesBlock? (graphPatternNotTriples DOT? triplesBlock?)*
  ;

/* sparql 1.1 r55 */

triplesBlock
  :
  triplesSameSubjectPath (DOT triplesBlock?)?
  ;

/* sparql 1.1 r56 */

graphPatternNotTriples
  :
  groupOrUnionGraphPattern
  | optionalGraphPattern
  | minusGraphPattern
  | graphGraphPattern
  | serviceGraphPattern
  | filter
  | bind
  | inlineData
  ;

/* sparql 1.1 r57 */

optionalGraphPattern
  :
  'optional' groupGraphPattern
  ;

/* sparql 1.1 r58 */

graphGraphPattern
  :
  'graph' varOrIriRef groupGraphPattern
  ;

/* sparql 1.1 r59 */

serviceGraphPattern
  :
  'service' 'silent'? varOrIriRef groupGraphPattern
  ;

/* sparql 1.1 r60 */

bind
  :
  'bind' OPEN_BRACE expression 'as' var CLOSE_BRACE
  ;

/* sparql 1.1 r61 */

inlineData
  :
  'values' dataBlock
  ;

/* sparql 1.1 r62 */

dataBlock
  :
  inlineDataOneVar | inlineDataFull
  ;

/* sparql 1.1 r63 */

inlineDataOneVar
  :
  var OPEN_CURLY_BRACE dataBlockValue* CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r64 */

inlineDataFull
  :
  (
    nil | OPEN_BRACE var* CLOSE_BRACE
  )
  OPEN_CURLY_BRACE
  (
    OPEN_BRACE dataBlockValue* CLOSE_BRACE | nil
  )*
  CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r65 */

dataBlockValue
  :
  iriRef
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | 'undef'
  ;

/* sparql 1.1 r66 */

minusGraphPattern
  :
  'minus' groupGraphPattern
  ;

/* sparql 1.1 r67 */

groupOrUnionGraphPattern
  :
  groupGraphPattern ('union' groupGraphPattern)*
  ;

/* sparql 1.1 r68 */

filter
  :
  'filter' constraint
  ;

/* sparql 1.1 r69 */

constraint
  :
  brackettedExpression
  | builtInCall
  | functionCall
  ;

/* sparql 1.1 r70 */

functionCall
  :
  iriRef argList
  ;

/* sparql 1.1 r71 */

argList
  :
  nil
  | OPEN_BRACE 'distinct'? expression (COMMA expression)* CLOSE_BRACE
  ;

/* sparql 1.1 r72 */

expressionList
  :
  nil
  | OPEN_BRACE expression (COMMA expression)* CLOSE_BRACE
  ;

/* sparql 1.1 r73 */

constructTemplate
  :
  OPEN_CURLY_BRACE constructTriples? CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r74 */

constructTriples
  :
  triplesSameSubject (DOT constructTriples?)?
  ;

/* sparql 1.1 r75 */

triplesSameSubject
  :
  varOrTerm propertyListNotEmpty
  | triplesNode propertyList
  ;

/* sparql 1.1 r76 */

propertyList
  :
  propertyListNotEmpty?
  ;

/* sparql 1.1 r77 */

propertyListNotEmpty
  :
  verb objectList ((SEMICOLON)(verb objectList)?)*
  ;

/* sparql 1.1 r78 */

verb
  :
  varOrIriRef
  | 'a'
  ;

/* sparql 1.1 r79 */

objectList
  :
  object ((COMMA)object)*
  ;

/* sparql 1.1 r80 */

object
  :
  graphNode
  ;

/* sparql 1.1 r81 */

triplesSameSubjectPath
  :
  varOrTerm propertyListPathNotEmpty
  | triplesNodePath propertyListPath
  ;

/* sparql 1.1 r82 */

propertyListPath
  :
  propertyListPathNotEmpty?
  ;

/* sparql 1.1 r83 */

propertyListPathNotEmpty
  :
  (
    verbPath
    | verbSimple
  )
  objectListPath
  (
    SEMICOLON
    (
      (
        verbPath
        | verbSimple
      )
      objectList
    )?
  )*
  ;

/* sparql 1.1 r84 */

verbPath
  :
  path
  ;

/* sparql 1.1 r85 */

verbSimple
  :
  var
  ;

/* sparql 1.1 r86 */

objectListPath
  :
  objectPath (COMMA objectPath)*
  ;

/* sparql 1.1 r87 */

objectPath
  :
  graphNodePath
  ;

/* sparql 1.1 r88 */

path
  :
  pathAlternative
  ;

/* sparql 1.1 r89 */

pathAlternative
  :
  pathSequence (PIPE pathSequence)*
  ;

/* sparql 1.1 r90 */

pathSequence
  :
  pathEltOrInverse (DIVIDE pathEltOrInverse)*
  ;

/* sparql 1.1 r91 */

pathElt
  :
  pathPrimary pathMod?
  ;

/* sparql 1.1 r92 */

pathEltOrInverse
  :
  pathElt
  | HAT pathElt
  ;

/* sparql 1.1 r93 */

pathMod
  :
  QUESTION
  | ASTERISK
  | PLUS
  ;

/* sparql 1.1 r94 */

pathPrimary
  :
  iriRef
  | 'a'
  | NOT_SIGN pathNegatedPropertySet
  | OPEN_BRACE path CLOSE_BRACE
  ;

/* sparql 1.1 r95 */

pathNegatedPropertySet
  :
  pathOneInPropertySet
  | OPEN_BRACE (pathOneInPropertySet (PIPE pathOneInPropertySet)*)? CLOSE_BRACE
  ;

/* sparql 1.1 r96 */

pathOneInPropertySet
  :
  iriRef
  | 'a'
  | HAT
  (
    iriRef
    | 'a'
  )
  ;

/* sparql 1.1 r97 */

integer
  :
  INTEGER
  ;

/* sparql 1.1 r98 */

triplesNode
  :
  collection
  | blankNodePropertyList
  ;

/* sparql 1.1 r99 */

blankNodePropertyList
  :
  OPEN_SQUARE_BRACE propertyListNotEmpty CLOSE_SQUARE_BRACE
  ;

/* sparql 1.1 r100 */

triplesNodePath
  :
  collectionPath | blankNodePropertyListPath
  ;

/* sparql 1.1 r101 */

blankNodePropertyListPath
  :
  OPEN_SQUARE_BRACE propertyListPathNotEmpty CLOSE_SQUARE_BRACE
  ;

/* sparql 1.1 r102 */

collection
  :
  OPEN_BRACE graphNode+ CLOSE_BRACE
  ;

/* sparql 1.1 r103 */

collectionPath
  :
  OPEN_BRACE graphNodePath+ CLOSE_BRACE
  ;

/* sparql 1.1 r104 */

graphNode
  :
  varOrTerm
  | triplesNode
  ;

/* sparql 1.1 r105 */

graphNodePath
  :
  varOrTerm
  | triplesNodePath
  ;

/* sparql 1.1 r106 */

varOrTerm
  :
  var
  | graphTerm
  ;

/* sparql 1.1 r107 */

varOrIriRef
  :
  var
  | iriRef
  ;

/* sparql 1.1 r108 */

var
  :
  var1 | var2
  ;

/* sparql 1.1 r109 */

graphTerm
  :
  iriRef
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | blankNode
  | nil
  ;

/* sparql 1.1 r110 */

expression
  :
  conditionalOrExpression
  ;

/* sparql 1.1 r111 */

conditionalOrExpression
  :
  conditionalAndExpression (OR conditionalAndExpression)*
  ;

/* sparql 1.1 r112 */

conditionalAndExpression
  :
  valueLogical (AND valueLogical)*
  ;

/* sparql 1.1 r113 */

valueLogical
  :
  relationalExpression
  ;

/* sparql 1.1 r114 */

relationalExpression
  :
  numericExpression
  (
    EQUAL numericExpression
    | NOT_EQUAL numericExpression
    | LESS numericExpression
    | GREATER numericExpression
    | LESS_EQUAL numericExpression
    | GREATER_EQUAL numericExpression
    | 'in' expressionList
    | 'not' 'in' expressionList
  )?
  ;

/* sparql 1.1 r115 */

numericExpression
  :
  additiveExpression
  ;

/* sparql 1.1 r116 */

additiveExpression
  :
  multiplicativeExpression
  (
    PLUS multiplicativeExpression
    | 'minus' multiplicativeExpression
    |
    (
      numericLiteralPositive
      | numericLiteralNegative
    )
    (
      (ASTERISK unaryExpression)
      | (DIVIDE unaryExpression)
    )*
  )*
  ;

/* sparql 1.1 r117 */

multiplicativeExpression
  :
  unaryExpression
  (
    ASTERISK unaryExpression
    | DIVIDE unaryExpression
  )*
  ;

/* sparql 1.1 r118 */

unaryExpression
  :
  NOT_SIGN primaryExpression
  | PLUS primaryExpression
  | 'minus' primaryExpression
  | primaryExpression
  ;

/* sparql 1.1 r119 */

primaryExpression
  :
  brackettedExpression
  | builtInCall
  | iriRefOrFunction
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | var
  ;

/* sparql 1.1 r120 */

brackettedExpression
  :
  OPEN_BRACE expression CLOSE_BRACE
  ;

/* sparql 1.1 r121 */

builtInCall
  :
  aggregate
  | 'str' OPEN_BRACE expression CLOSE_BRACE
  | 'lang' OPEN_BRACE expression CLOSE_BRACE
  | 'langmatches' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'datatype' OPEN_BRACE expression CLOSE_BRACE
  | 'bound' OPEN_BRACE var CLOSE_BRACE
  | 'iri' OPEN_BRACE expression CLOSE_BRACE
  | 'uri' OPEN_BRACE expression CLOSE_BRACE
  | 'bnode'
  (
    (OPEN_BRACE expression CLOSE_BRACE)
    | nil
  )
  | 'rand' nil
  | 'abs' OPEN_BRACE expression CLOSE_BRACE
  | 'ceil' OPEN_BRACE expression CLOSE_BRACE
  | 'floor' OPEN_BRACE expression CLOSE_BRACE
  | 'round' OPEN_BRACE expression CLOSE_BRACE
  | 'concat' expressionList
  | substringExpression
  | 'strlen' OPEN_BRACE expression CLOSE_BRACE
  | strReplaceExpression
  | 'ucase' OPEN_BRACE expression CLOSE_BRACE
  | 'lcase' OPEN_BRACE expression CLOSE_BRACE
  | 'encode_for_uri' OPEN_BRACE expression CLOSE_BRACE
  | 'contains' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'strstarts' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'strends' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'strbefore' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'strafter' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'year' OPEN_BRACE expression CLOSE_BRACE
  | 'month' OPEN_BRACE expression CLOSE_BRACE
  | 'day' OPEN_BRACE expression CLOSE_BRACE
  | 'hours' OPEN_BRACE expression CLOSE_BRACE
  | 'minutes' OPEN_BRACE expression CLOSE_BRACE
  | 'seconds' OPEN_BRACE expression CLOSE_BRACE
  | 'timezone' OPEN_BRACE expression CLOSE_BRACE
  | 'tz' OPEN_BRACE expression CLOSE_BRACE
  | 'now' nil
  | 'uuid' nil
  | 'struuid' nil
  | 'md5' OPEN_BRACE expression CLOSE_BRACE
  | 'sha1' OPEN_BRACE expression CLOSE_BRACE
  | 'sha256' OPEN_BRACE expression CLOSE_BRACE
  | 'sha384' OPEN_BRACE expression CLOSE_BRACE
  | 'sha512' OPEN_BRACE expression CLOSE_BRACE
  | 'coalesce' expressionList
  | 'if' OPEN_BRACE expression COMMA expression COMMA expression CLOSE_BRACE
  | 'strlang' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'strdt' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'sameterm' OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | 'isiri' OPEN_BRACE expression CLOSE_BRACE
  | 'isuri' OPEN_BRACE expression CLOSE_BRACE
  | 'isblank' OPEN_BRACE expression CLOSE_BRACE
  | 'isliteral' OPEN_BRACE expression CLOSE_BRACE
  | 'isnumeric' OPEN_BRACE expression CLOSE_BRACE
  | regexExpression
  | existsFunc
  | notExistsFunc
  ;

/* sparql 1.1 r122 */

regexExpression
  :
  'regex' OPEN_BRACE expression COMMA expression (COMMA expression)? CLOSE_BRACE
  ;

/* sparql 1.1 r123 */

substringExpression
  :
  'substr' OPEN_BRACE expression COMMA expression (COMMA expression)? CLOSE_BRACE
  ;

/* sparql 1.1 r124 */

strReplaceExpression
  :
  'replace' OPEN_BRACE expression COMMA expression COMMA expression (COMMA expression)? CLOSE_BRACE
  ;

/* sparql 1.1 r125 */

existsFunc
  :
  'exists' groupGraphPattern
  ;

/* sparql 1.1 r126 */

notExistsFunc
  :
  'not' 'exists' groupGraphPattern
  ;

/* sparql 1.1 r127 */

aggregate
  :
  (
    'count' OPEN_BRACE 'distinct'?
    (
      ASTERISK
      | expression
    )
    CLOSE_BRACE
    | 'sum' OPEN_BRACE 'distinct'? expression CLOSE_BRACE
    | 'min' OPEN_BRACE 'distinct'? expression CLOSE_BRACE
    | 'max' OPEN_BRACE 'distinct'? expression CLOSE_BRACE
    | 'avg' OPEN_BRACE 'distinct'? expression CLOSE_BRACE
    | 'sample' OPEN_BRACE 'distinct'? expression CLOSE_BRACE
    | 'group_concat' OPEN_BRACE 'distinct'? expression (SEMICOLON 'separator' EQUAL string)? CLOSE_BRACE
  )
  ;

/* sparql 1.1 r128 */

iriRefOrFunction
  :
  iriRef argList?
  ;

/* sparql 1.1 r129 */

rdfLiteral
  :
  string
  (
    LANGTAG
    | (REFERENCE iriRef)
  )?
  ;

/* sparql 1.1 r130 */

numericLiteral
  :
  numericLiteralUnsigned
  | numericLiteralPositive
  | numericLiteralNegative
  ;

/* sparql 1.1 r131 */

numericLiteralUnsigned
  :
  INTEGER
  | DECIMAL
  | DOUBLE
  ;

/* sparql 1.1 r132 */

numericLiteralPositive
  :
  INTEGER_POSITIVE
  | DECIMAL_POSITIVE
  | DOUBLE_POSITIVE
  ;

/* sparql 1.1 r133 */

numericLiteralNegative
  :
  INTEGER_NEGATIVE
  | DECIMAL_NEGATIVE
  | DOUBLE_NEGATIVE
  ;

/* sparql 1.1 r134 */

booleanLiteral
  :
  'true'
  | 'false'
  ;

/* sparql 1.1 r135 */

string
  :
  STRING_LITERAL1
  | STRING_LITERAL2
  | STRING_LITERAL_LONG1
  | STRING_LITERAL_LONG2
  ;

/* sparql 1.1 r136 */

iriRef
  :
  IRI_REF
  | prefixedName
  ;

/* sparql 1.1 r137 */

prefixedName
  :
  PNAME_LN
  | PNAME_NS
  ;

/* sparql 1.1 r138 */

blankNode
  :
  BLANK_NODE_LABEL
  | anon
  ;

/* sparql 1.1 r143 */

var1
  :
  QUESTION VARNAME
  ;

/* sparql 1.1 r144 */

var2
  :
  DOLLAR VARNAME
  ;


/* sparql 1.1 r161 */

nil
  :
  OPEN_BRACE WS* CLOSE_BRACE
  ;

/* sparql 1.1 r163 */

anon
  :
  OPEN_SQUARE_BRACE WS* CLOSE_SQUARE_BRACE
  ;

/* sparql 1.1 r139 */

IRI_REF: '<' ~('<' | '>' | '"' | '{' | '}' | '|' | '^' | '\\' | '`' | '\u0000'..'\u0020')* '>';

/* sparql 1.1 r140 */

PNAME_NS
    : PN_PREFIX? ':'
    ;

/* sparql 1.1 r141 */

PNAME_LN
    : PNAME_NS PN_LOCAL
    ;

/* sparql 1.1 r142 */

BLANK_NODE_LABEL
    : '_:' PN_LOCAL
    ;

/* sparql 1.1 r145 */

LANGTAG
    : '@' PN_CHARS_BASE+ ('-' (PN_CHARS_BASE DIGIT)+)*
    ;

/* sparql 1.1 r146 */

INTEGER
    : DIGIT+
    ;

/* sparql 1.1 r147 */

DECIMAL
    : DIGIT+ '.' DIGIT*
    | '.' DIGIT+
    ;

/* sparql 1.1 r148 */

DOUBLE
    : DIGIT+ '.' DIGIT* EXPONENT
    | '.' DIGIT+ EXPONENT
    | DIGIT+ EXPONENT
    ;

/* sparql 1.1 r149 */

INTEGER_POSITIVE
    : '+' INTEGER
    ;

/* sparql 1.1 r150 */

DECIMAL_POSITIVE
    : '+' DECIMAL
    ;

/* sparql 1.1 r151 */

DOUBLE_POSITIVE
    : '+' DOUBLE
    ;

/* sparql 1.1 r152 */

INTEGER_NEGATIVE
    : '-' INTEGER
    ;

/* sparql 1.1 r153 */

DECIMAL_NEGATIVE
    : '-' DECIMAL
    ;

/* sparql 1.1 r154 */

DOUBLE_NEGATIVE
    : '-' DOUBLE
    ;

/* sparql 1.1 r155 */

EXPONENT
    : ('e'|'E') ('+'|'-')? DIGIT+
    ;

/* sparql 1.1 r156 */

STRING_LITERAL1
    : '\'' ( ~('\u0027' | '\u005C' | '\u000A' | '\u000D') | ECHAR )* '\''
    ;

/* sparql 1.1 r157 */

STRING_LITERAL2
    : '"'  ( ~('\u0022' | '\u005C' | '\u000A' | '\u000D') | ECHAR )* '"'
    ;

/* sparql 1.1 r158 */

STRING_LITERAL_LONG1
    : '\'\'\'' ( ( '\'' | '\'\'' )? (~('\'' | '\\') | ECHAR ) )* '\'\'\''
    ;

/* sparql 1.1 r159 */

STRING_LITERAL_LONG2
    : '"""' ( ( '"' | '""' )? ( ~('\'' | '\\') | ECHAR ) )* '"""'
    ;

/* sparql 1.1 r160 */

ECHAR
    : '\\' ('t' | 'b' | 'n' | 'r' | 'f' | '"' | '\'')
    ;

/* sparql 1.1 r166 */

// This needs to be above PN_CHARS_U
VARNAME
  :
  (
    PN_CHARS_U | DIGIT
  )
  (
    PN_CHARS_U | PN_CHARS_SUFFIX
  )*
  ;

/* sparql 1.1 r165 */

PN_CHARS_U
    : PN_CHARS_BASE | '_'
    ;

/* sparql 1.1 r167 */

fragment
PN_CHARS
    : PN_CHARS_U
    | '-'
    | PN_CHARS_SUFFIX
    ;

/* sparql 1.1 r168 */

PN_PREFIX
    : PN_CHARS_BASE ((PN_CHARS|'.')* PN_CHARS)?
    ;

/* sparql 1.1 r169 */

PN_LOCAL
    : ( PN_CHARS_U | COLON | DIGIT | PLX ) ( (PN_CHARS | DOT | COLON | PLX)* (PN_CHARS | COLON | PLX) )?
    ;

/* sparql 1.1 r170 */

PLX
  : PERCENT | PN_LOCAL_ESC
  ;

/* sparql 1.1 r171 */

PERCENT
  : '%' HEX HEX
  ;

/* sparql 1.1 r172 */

HEX
  : DIGIT | 'A'..'F' | 'a'..'f'
  ;

/* sparql 1.1 r173 */

PN_LOCAL_ESC
  : '\\' ( '_' | '~' | '.' | '-' | '!' | '$' | '&' | '\'' | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%' )
  ;

fragment
DIGIT
    : '0'..'9'
    ;

fragment
PN_CHARS_SUFFIX
    : DIGIT
    | '\u00B7'
    | '\u0300'..'\u036F'
    | '\u203F'..'\u2040'
    ;

/* sparql 1.1 r164 */

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
    //| '\u10000'..'\uEFFFF' TODO: How do we handle these?
    ;

/* sparql 1.1 r162 */

WS
  : (' '
  | '\t'
  | '\n'
  | '\r')+ ->channel(HIDDEN)
  ;

OPEN_BRACE: '(';

CLOSE_BRACE: ')';

OPEN_CURLY_BRACE: '{';

CLOSE_CURLY_BRACE: '}';

ASTERISK: '*';

QUESTION: '?';

DOLLAR: '$';

DOT: '.';

COMMA: ',';

SEMICOLON: ';';

PIPE: '|';

DIVIDE: '/';

HAT: '^';

PLUS: '+';

NOT_SIGN: '!';

OPEN_SQUARE_BRACE: '[';

CLOSE_SQUARE_BRACE: ']';

OR: '||';

AND: '&&';

EQUAL: '=';

NOT_EQUAL: '!=';

LESS: '<';

GREATER: '>';

LESS_EQUAL: '<=';

GREATER_EQUAL: '>=';

REFERENCE: '^^';

COLON: ':';

LINE_FEED: '\n';

CARRIAGE_RETURN: '\r';

EOL_COMMENT: '#'.*?(CARRIAGE_RETURN?LINE_FEED) -> skip;
