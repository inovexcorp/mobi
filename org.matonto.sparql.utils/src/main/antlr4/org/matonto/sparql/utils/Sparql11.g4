grammar Sparql11;

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
  ;

/* sparql 1.1 r3 */

prologue
  :
  baseDecl? prefixDecl*
  ;

/* sparql 1.1 r4 */

baseDecl
  :
  BASE IRI_REF
  ;

/* sparql 1.1 r5 */

prefixDecl
  :
  PREFIX PNAME_NS IRI_REF
  ;

/* sparql 1.1 r6 */

selectQuery
  :
  selectClause datasetClause* whereClause solutionModifier bindingsClause
  ;

/* sparql 1.1 r7 */

subSelect
  :
  selectClause whereClause solutionModifier
  ;

/* sparql 1.1 r8 */

selectClause
  :
  SELECT
  (
    DISTINCT
    | REDUCED
  )?
  (
    variable
    | (OPEN_BRACE expression AS variable CLOSE_BRACE)+
    | ASTERISK
  )
  ;

/* sparql 1.1 r9 */

constructQuery
  :
  CONSTRUCT constructTemplate datasetClause* whereClause solutionModifier
  ;

/* sparql 1.1 r10 */

describeQuery
  :
  DESCRIBE
  (
    varOrIriRef+
    | ASTERISK
  )
  datasetClause* whereClause? solutionModifier
  ;

/* sparql 1.1 r11 */

askQuery
  :
  ASK datasetClause* whereClause
  ;

/* sparql 1.1 r12 */

datasetClause
  :
  FROM
  (
    defaultGraphClause
    | namedGraphClause
  )
  ;

/* sparql 1.1 r13 */

defaultGraphClause
  :
  sourceSelector
  ;

/* sparql 1.1 r14 */

namedGraphClause
  :
  NAMED sourceSelector
  ;

/* sparql 1.1 r15 */

sourceSelector
  :
  iriRef
  ;

/* sparql 1.1 r16 */

whereClause
  :
  WHERE? groupGraphPattern
  ;

/* sparql 1.1 r17 */

solutionModifier
  :
  groupClause? havingClause? orderClause? limitOffsetClauses?
  ;

/* sparql 1.1 r18 */

groupClause
  :
  GROUP BY groupCondition+
  ;

/* sparql 1.1 r19 */

groupCondition
  :
  builtInCall
  | functionCall
  | (OPEN_BRACE expression (AS variable)? CLOSE_BRACE)
  | variable
  ;

/* sparql 1.1 r20 */

havingClause
  :
  HAVING havingCondition+
  ;

/* sparql 1.1 r21 */

havingCondition
  :
  constraint
  ;

/* sparql 1.1 r22 */

orderClause
  :
  ORDER BY orderCondition+
  ;

/* sparql 1.1 r23 */

orderCondition
  :
  (
    (
      ASC
      | DESC
    )
    brackettedExpression
  )
  |
  (
    constraint
    | variable
  )
  ;

/* sparql 1.1 r24 */

limitOffsetClauses
  :
  (limitClause offsetClause?)
  | (offsetClause limitClause?)
  ;

/* sparql 1.1 r25 */

limitClause
  :
  LIMIT INTEGER
  ;

/* sparql 1.1 r26 */

offsetClause
  :
  OFFSET INTEGER
  ;

/* sparql 1.1 r27 */

bindingsClause
  :
  (
    BINDINGS variable* OPEN_CURLY_BRACE
    (
      OPEN_BRACE bindingValue+ CLOSE_BRACE
      | (OPEN_BRACE WS* CLOSE_BRACE)
    )*
    CLOSE_CURLY_BRACE
  )?
  ;

/* sparql 1.1 r28 */

bindingValue
  :
  iriRef
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | UNDEF
  ;

/* sparql 1.1 r29 */

updateUnit
  :
  update
  ;

/* sparql 1.1 r30 */

update
  :
  prologue update1 (SEMICOLON update)?
  ;

/* sparql 1.1 r31 */

update1
  :
  (
    | load
    | clear
    | drop
    | create
    | insertData
    | deleteData
    | deleteWhere
    | modify
  )
  ;

/* sparql 1.1 r32 */

load
  :
  LOAD iriRef (INTO graphRef)?
  ;

/* sparql 1.1 r33 */

clear
  :
  CLEAR SILENT? graphRefAll
  ;

/* sparql 1.1 r34 */

drop
  :
  DROP SILENT? graphRefAll
  ;

/* sparql 1.1 r35 */

create
  :
  CREATE SILENT? graphRef
  ;

/* sparql 1.1 r36 */

insertData
  :
  //TODO check out what <WS*> means
  INSERT /* <WS*> */
  COMMA DATA quadData
  ;

/* sparql 1.1 r37 */

deleteData
  :
  //TODO check out what <WS*> means
  DELETE /* <WS*> */
  DATA quadData
  ;

/* sparql 1.1 r38 */

deleteWhere
  :
  //TODO check out what <WS*> means
  DELETE /* <WS*> */
  WHERE quadPattern
  ;

/* sparql 1.1 r39 */

modify
  :
  (WITH iriRef)?
  (
    deleteClause insertClause?
    | insertClause
  )
  usingClause* WHERE groupGraphPattern
  ;

/* sparql 1.1 r40 */

deleteClause
  :
  DELETE quadPattern
  ;

/* sparql 1.1 r41 */

insertClause
  :
  INSERT quadPattern
  ;

/* sparql 1.1 r42 */

usingClause
  :
  USING
  (
    iriRef
    | NAMED iriRef
  )
  ;

/* sparql 1.1 r43 */

graphRef
  :
  GRAPH
  | iriRef
  ;

/* sparql 1.1 r44 */

graphRefAll
  :
  graphRef
  | DEFAULT
  | NAMED
  | ALL
  ;

/* sparql 1.1 r45 */

quadPattern
  :
  OPEN_CURLY_BRACE quads CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r46 */

quadData
  :
  OPEN_CURLY_BRACE quads CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r47 */

quads
  :
  triplesTemplate? (quadsNotTriples DOT? triplesTemplate?)*
  ;

/* sparql 1.1 r48 */

quadsNotTriples
  :
  GRAPH varOrIriRef OPEN_CURLY_BRACE triplesTemplate CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r49 */

triplesTemplate
  :
  triplesSameSubject (DOT triplesTemplate?)?
  ;

/* sparql 1.1 r50 */

groupGraphPattern
  :
  OPEN_CURLY_BRACE
  (
    subSelect
    | groupGraphPatternSub
  )
  CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r51 */

groupGraphPatternSub
  :
  triplesBlock? (graphPatternNotTriples DOT? triplesBlock?)*
  ;

/* sparql 1.1 r52 */

triplesBlock
  :
  triplesSameSubjectPath (DOT triplesBlock?)?
  ;

/* sparql 1.1 r53 */

graphPatternNotTriples
  :
  groupOrUnionGraphPattern
  | optionalGraphPattern
  | minusGraphPattern
  | graphGraphPattern
  | serviceGraphPattern
  | filter
  ;

/* sparql 1.1 r54 */

optionalGraphPattern
  :
  OPTIONAL groupGraphPattern
  ;

/* sparql 1.1 r55 */

graphGraphPattern
  :
  GRAPH varOrIriRef groupGraphPattern
  ;

/* sparql 1.1 r56 */

serviceGraphPattern
  :
  SERVICE varOrIriRef groupGraphPattern
  ;

/* sparql 1.1 r57 */

minusGraphPattern
  :
  MINUS_P groupGraphPattern
  ;

/* sparql 1.1 r58 */

groupOrUnionGraphPattern
  :
  groupGraphPattern (UNION groupGraphPattern)*
  ;

/* sparql 1.1 r59 */

filter
  :
  FILTER constraint
  ;

/* sparql 1.1 r60 */

constraint
  :
  brackettedExpression
  | builtInCall
  | functionCall
  ;

/* sparql 1.1 r61 */

functionCall
  :
  iriRef argList
  ;

/* sparql 1.1 r62 */

argList
  :
  OPEN_BRACE WS* CLOSE_BRACE
  | OPEN_BRACE DISTINCT? expression (COMMA expression)* CLOSE_BRACE
  ;

/* sparql 1.1 r63 */

expressionList
  :
  OPEN_BRACE WS* CLOSE_BRACE
  | OPEN_BRACE expression (COMMA expression)* CLOSE_BRACE
  ;

/* sparql 1.1 r64 */

constructTemplate
  :
  OPEN_CURLY_BRACE constructTriples? CLOSE_CURLY_BRACE
  ;

/* sparql 1.1 r65 */

constructTriples
  :
  triplesSameSubject (DOT constructTriples?)?
  ;

/* sparql 1.1 r66 */

triplesSameSubject
  :
  varOrTerm propertyListNotEmpty
  | triplesNode propertyList
  ;

/* sparql 1.1 r67 */

propertyListNotEmpty
  :
  verb objectList (SEMICOLON (verb objectList)?)*
  ;

/* sparql 1.1 r68 */

propertyList
  :
  propertyListNotEmpty?
  ;

/* sparql 1.1 r69 */

objectList
  :
  object (COMMA object)*
  ;

/* sparql 1.1 r70 */

object
  :
  graphNode
  ;

/* sparql 1.1 r71 */

verb
  :
  varOrIriRef
  | A
  ;

/* sparql 1.1 r72 */

triplesSameSubjectPath
  :
  varOrTerm propertyListNotEmptyPath
  | triplesNode propertyListPath
  ;

/* sparql 1.1 r73 */

propertyListNotEmptyPath
  :
  (
    verbPath
    | verbSimple
  )
  objectList
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

/* sparql 1.1 r74 */

propertyListPath
  :
  propertyListNotEmpty?
  ;

/* sparql 1.1 r75 */

verbPath
  :
  path
  ;

/* sparql 1.1 r76 */

verbSimple
  :
  variable
  ;

/* sparql 1.1 r77 */

path
  :
  pathAlternative
  ;

/* sparql 1.1 r78 */

pathAlternative
  :
  pathSequence (PIPE pathSequence)*
  ;

/* sparql 1.1 r79 */

pathSequence
  :
  pathEltOrInverse (DIVIDE pathEltOrInverse)*
  ;

/* sparql 1.1 r80 */

pathElt
  :
  pathPrimary pathMod?
  ;

/* sparql 1.1 r81 */

pathEltOrInverse
  :
  pathElt
  | HAT_LABEL pathElt
  ;

/* sparql 1.1 r82 */

pathMod
  :
  (
    ASTERISK
    | QUESTION_MARK_LABEL
    | PLUS
    | OPEN_CURLY_BRACE
    (
      integer
      (
        COMMA
        (
          CLOSE_CURLY_BRACE
          | integer CLOSE_CURLY_BRACE
        )
        | CLOSE_CURLY_BRACE
      )
      | COMMA integer CLOSE_CURLY_BRACE
    )
  )
  ;

/* sparql 1.1 r83 */

pathPrimary
  :
  iriRef
  | A
  | NOT_SIGN pathNegatedPropertySet
  | OPEN_BRACE path CLOSE_BRACE
  ;

/* sparql 1.1 r84 */

pathNegatedPropertySet
  :
  pathOneInPropertySet
  | OPEN_BRACE (pathOneInPropertySet (PIPE pathOneInPropertySet)*)? CLOSE_BRACE
  ;

/* sparql 1.1 r85 */

pathOneInPropertySet
  :
  iriRef
  | A
  | HAT
  (
    iriRef
    | A
  )
  ;

/* sparql 1.1 r86 */

integer
  :
  INTEGER
  ;

/* sparql 1.1 r87 */

triplesNode
  :
  collection
  | blankNodePropertyList
  ;

/* sparql 1.1 r88 */

blankNodePropertyList
  :
  OPEN_SQUARE_BRACE propertyListNotEmpty CLOSE_SQUARE_BRACE
  ;

/* sparql 1.1 r89 */

collection
  :
  OPEN_BRACE graphNode+ CLOSE_BRACE
  ;

/* sparql 1.1 r90 */

graphNode
  :
  varOrTerm
  | triplesNode
  ;

/* sparql 1.1 r91 */

varOrTerm
  :
  variable
  | graphTerm
  ;

/* sparql 1.1 r92 */

varOrIriRef
  :
  variable
  | iriRef
  ;

/* sparql 1.1 r93 */

variable
  :
  VAR1
  | VAR2
  ;

/* sparql 1.1 r94 */

graphTerm
  :
  iriRef
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | blankNode
  | OPEN_BRACE WS* CLOSE_BRACE
  ;

/* sparql 1.1 r95 */

expression
  :
  conditionalOrExpression
  ;

/* sparql 1.1 r96 */

conditionalOrExpression
  :
  conditionalAndExpression (OR conditionalAndExpression)*
  ;

/* sparql 1.1 r97 */

conditionalAndExpression
  :
  valueLogical (AND valueLogical)*
  ;

/* sparql 1.1 r98 */

valueLogical
  :
  relationalExpression
  ;

/* sparql 1.1 r99 */

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
    | IN expressionList
    | NOT IN expressionList
  )?
  ;

/* sparql 1.1 r100 */

numericExpression
  :
  additiveExpression
  ;

/* sparql 1.1 r101 */

additiveExpression
  :
  multiplicativeExpression
  (
    PLUS multiplicativeExpression
    | MINUS multiplicativeExpression
    |
    (
      numericLiteralPositive
      | numericLiteralNegative
    )
    (
      (ASTERISK unaryExpression)
      | (DIVIDE unaryExpression)
    )?
  )*
  ;

/* sparql 1.1 r102 */

multiplicativeExpression
  :
  unaryExpression
  (
    ASTERISK unaryExpression
    | DIVIDE unaryExpression
  )*
  ;

/* sparql 1.1 r103 */

unaryExpression
  :
  NOT_SIGN primaryExpression
  | PLUS primaryExpression
  | MINUS primaryExpression
  | primaryExpression
  ;

/* sparql 1.1 r104 */

primaryExpression
  :
  brackettedExpression
  | builtInCall
  | iriRefOrFunction
  | rdfLiteral
  | numericLiteral
  | booleanLiteral
  | variable
  | aggregate
  ;

/* sparql 1.1 r105 */

brackettedExpression
  :
  OPEN_BRACE expression CLOSE_BRACE
  ;

/* sparql 1.1 r106 */

builtInCall
  :
  STR OPEN_BRACE expression CLOSE_BRACE
  | LANG OPEN_BRACE expression CLOSE_BRACE
  | LANGMATCHES OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | DATATYPE OPEN_BRACE expression CLOSE_BRACE
  | BOUND OPEN_BRACE variable CLOSE_BRACE
  | IRI OPEN_BRACE expression CLOSE_BRACE
  | URI OPEN_BRACE expression CLOSE_BRACE
  | BNODE
  (
    (OPEN_BRACE variable CLOSE_BRACE)
    | OPEN_BRACE WS* CLOSE_BRACE
  )
  | COALESCE expressionList
  | IF OPEN_BRACE expression COMMA expression COMMA expression CLOSE_BRACE
  | STRLANG OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | STRDT OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | SAMETERM OPEN_BRACE expression COMMA expression CLOSE_BRACE
  | ISIRI OPEN_BRACE expression CLOSE_BRACE
  | ISURI OPEN_BRACE expression CLOSE_BRACE
  | ISBLANK OPEN_BRACE expression CLOSE_BRACE
  | ISLITERAL OPEN_BRACE expression CLOSE_BRACE
  | ISNUMERIC OPEN_BRACE expression CLOSE_BRACE
  | regexExpression
  | existsFunc
  | notExistsFunc
  ;

/* sparql 1.1 r107 */

regexExpression
  :
  REGEX OPEN_BRACE expression COMMA expression (COMMA expression)? CLOSE_BRACE
  ;

/* sparql 1.1 r108 */

existsFunc
  :
  EXISTS groupGraphPattern
  ;

/* sparql 1.1 r109 */

notExistsFunc
  :
  NOT EXISTS groupGraphPattern
  ;

/* sparql 1.1 r110 */

aggregate
  :
  (
    COUNT OPEN_BRACE DISTINCT?
    (
      ASTERISK
      | expression
    )
    CLOSE_BRACE
    | SUM OPEN_BRACE DISTINCT? expression CLOSE_BRACE
    | MIN OPEN_BRACE DISTINCT? expression CLOSE_BRACE
    | MAX OPEN_BRACE DISTINCT? expression CLOSE_BRACE
    | AVG OPEN_BRACE DISTINCT? expression CLOSE_BRACE
    | SAMPLE OPEN_BRACE DISTINCT? expression CLOSE_BRACE
    | GROUP_CONCAT OPEN_BRACE DISTINCT? expression (SEMICOLON SEPARATOR EQUAL string)? CLOSE_BRACE
  )
  ;

/* sparql 1.1 r111 */

iriRefOrFunction
  :
  iriRef argList?
  ;

/* sparql 1.1 r112 */

rdfLiteral
  :
  string
  (
    LANGTAG
    | (REFERENCE iriRef)
  )?
  ;

/* sparql 1.1 r113 */

numericLiteral
  :
  numericLiteralUnsigned
  | numericLiteralPositive
  | numericLiteralNegative
  ;

/* sparql 1.1 r114 */

numericLiteralUnsigned
  :
  INTEGER
  | DECIMAL
  | DOUBLE
  ;

/* sparql 1.1 r115 */

numericLiteralPositive
  :
  INTEGER_POSITIVE
  | DECIMAL_POSITIVE
  | DOUBLE_POSITIVE
  ;

/* sparql 1.1 r116 */

numericLiteralNegative
  :
  INTEGER_NEGATIVE
  | DECIMAL_NEGATIVE
  | DOUBLE_NEGATIVE
  ;

/* sparql 1.1 r117 */

booleanLiteral
  :
  TRUE
  | FALSE
  ;

/* sparql 1.1 r118 */

string
  :
  STRING_LITERAL1
  | STRING_LITERAL2
  | STRING_LITERAL_LONG1
  | STRING_LITERAL_LONG2
  ;

/* sparql 1.1 r119 */

iriRef
  :
  IRI_REF
  | prefixedName
  ;

/* sparql 1.1 r120 */

prefixedName
  :
  PNAME_LN
  | PNAME_NS
  ;

/* sparql 1.1 r121 */

blankNode
  :
  BLANK_NODE_LABEL
  | OPEN_SQUARE_BRACE WS* CLOSE_SQUARE_BRACE
  ;
