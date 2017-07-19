/*-
 * #%L
 * org.matonto.sparql.utils
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
// Generated from org/matonto/sparql/utils/Sparql11.g4 by ANTLR 4.6
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by Sparql11Parser.
function Sparql11Listener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

Sparql11Listener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
Sparql11Listener.prototype.constructor = Sparql11Listener;

// Enter a parse tree produced by Sparql11Parser#queryUnit.
Sparql11Listener.prototype.enterQueryUnit = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#queryUnit.
Sparql11Listener.prototype.exitQueryUnit = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#query.
Sparql11Listener.prototype.enterQuery = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#query.
Sparql11Listener.prototype.exitQuery = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#updateUnit.
Sparql11Listener.prototype.enterUpdateUnit = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#updateUnit.
Sparql11Listener.prototype.exitUpdateUnit = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#prologue.
Sparql11Listener.prototype.enterPrologue = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#prologue.
Sparql11Listener.prototype.exitPrologue = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#baseDecl.
Sparql11Listener.prototype.enterBaseDecl = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#baseDecl.
Sparql11Listener.prototype.exitBaseDecl = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#prefixDecl.
Sparql11Listener.prototype.enterPrefixDecl = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#prefixDecl.
Sparql11Listener.prototype.exitPrefixDecl = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#selectQuery.
Sparql11Listener.prototype.enterSelectQuery = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#selectQuery.
Sparql11Listener.prototype.exitSelectQuery = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#subSelect.
Sparql11Listener.prototype.enterSubSelect = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#subSelect.
Sparql11Listener.prototype.exitSubSelect = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#selectClause.
Sparql11Listener.prototype.enterSelectClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#selectClause.
Sparql11Listener.prototype.exitSelectClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#constructQuery.
Sparql11Listener.prototype.enterConstructQuery = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#constructQuery.
Sparql11Listener.prototype.exitConstructQuery = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#describeQuery.
Sparql11Listener.prototype.enterDescribeQuery = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#describeQuery.
Sparql11Listener.prototype.exitDescribeQuery = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#askQuery.
Sparql11Listener.prototype.enterAskQuery = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#askQuery.
Sparql11Listener.prototype.exitAskQuery = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#datasetClause.
Sparql11Listener.prototype.enterDatasetClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#datasetClause.
Sparql11Listener.prototype.exitDatasetClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#defaultGraphClause.
Sparql11Listener.prototype.enterDefaultGraphClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#defaultGraphClause.
Sparql11Listener.prototype.exitDefaultGraphClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#namedGraphClause.
Sparql11Listener.prototype.enterNamedGraphClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#namedGraphClause.
Sparql11Listener.prototype.exitNamedGraphClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#sourceSelector.
Sparql11Listener.prototype.enterSourceSelector = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#sourceSelector.
Sparql11Listener.prototype.exitSourceSelector = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#whereClause.
Sparql11Listener.prototype.enterWhereClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#whereClause.
Sparql11Listener.prototype.exitWhereClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#solutionModifier.
Sparql11Listener.prototype.enterSolutionModifier = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#solutionModifier.
Sparql11Listener.prototype.exitSolutionModifier = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#groupClause.
Sparql11Listener.prototype.enterGroupClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#groupClause.
Sparql11Listener.prototype.exitGroupClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#groupCondition.
Sparql11Listener.prototype.enterGroupCondition = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#groupCondition.
Sparql11Listener.prototype.exitGroupCondition = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#havingClause.
Sparql11Listener.prototype.enterHavingClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#havingClause.
Sparql11Listener.prototype.exitHavingClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#havingCondition.
Sparql11Listener.prototype.enterHavingCondition = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#havingCondition.
Sparql11Listener.prototype.exitHavingCondition = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#orderClause.
Sparql11Listener.prototype.enterOrderClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#orderClause.
Sparql11Listener.prototype.exitOrderClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#orderCondition.
Sparql11Listener.prototype.enterOrderCondition = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#orderCondition.
Sparql11Listener.prototype.exitOrderCondition = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#limitOffsetClauses.
Sparql11Listener.prototype.enterLimitOffsetClauses = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#limitOffsetClauses.
Sparql11Listener.prototype.exitLimitOffsetClauses = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#limitClause.
Sparql11Listener.prototype.enterLimitClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#limitClause.
Sparql11Listener.prototype.exitLimitClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#offsetClause.
Sparql11Listener.prototype.enterOffsetClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#offsetClause.
Sparql11Listener.prototype.exitOffsetClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#valuesClause.
Sparql11Listener.prototype.enterValuesClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#valuesClause.
Sparql11Listener.prototype.exitValuesClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#update.
Sparql11Listener.prototype.enterUpdate = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#update.
Sparql11Listener.prototype.exitUpdate = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#update1.
Sparql11Listener.prototype.enterUpdate1 = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#update1.
Sparql11Listener.prototype.exitUpdate1 = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#load.
Sparql11Listener.prototype.enterLoad = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#load.
Sparql11Listener.prototype.exitLoad = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#clear.
Sparql11Listener.prototype.enterClear = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#clear.
Sparql11Listener.prototype.exitClear = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#drop.
Sparql11Listener.prototype.enterDrop = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#drop.
Sparql11Listener.prototype.exitDrop = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#create.
Sparql11Listener.prototype.enterCreate = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#create.
Sparql11Listener.prototype.exitCreate = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#add.
Sparql11Listener.prototype.enterAdd = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#add.
Sparql11Listener.prototype.exitAdd = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#move.
Sparql11Listener.prototype.enterMove = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#move.
Sparql11Listener.prototype.exitMove = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#copy.
Sparql11Listener.prototype.enterCopy = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#copy.
Sparql11Listener.prototype.exitCopy = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#insertData.
Sparql11Listener.prototype.enterInsertData = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#insertData.
Sparql11Listener.prototype.exitInsertData = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#deleteData.
Sparql11Listener.prototype.enterDeleteData = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#deleteData.
Sparql11Listener.prototype.exitDeleteData = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#deleteWhere.
Sparql11Listener.prototype.enterDeleteWhere = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#deleteWhere.
Sparql11Listener.prototype.exitDeleteWhere = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#modify.
Sparql11Listener.prototype.enterModify = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#modify.
Sparql11Listener.prototype.exitModify = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#deleteClause.
Sparql11Listener.prototype.enterDeleteClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#deleteClause.
Sparql11Listener.prototype.exitDeleteClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#insertClause.
Sparql11Listener.prototype.enterInsertClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#insertClause.
Sparql11Listener.prototype.exitInsertClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#usingClause.
Sparql11Listener.prototype.enterUsingClause = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#usingClause.
Sparql11Listener.prototype.exitUsingClause = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphOrDefault.
Sparql11Listener.prototype.enterGraphOrDefault = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphOrDefault.
Sparql11Listener.prototype.exitGraphOrDefault = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphRef.
Sparql11Listener.prototype.enterGraphRef = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphRef.
Sparql11Listener.prototype.exitGraphRef = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphRefAll.
Sparql11Listener.prototype.enterGraphRefAll = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphRefAll.
Sparql11Listener.prototype.exitGraphRefAll = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#quadPattern.
Sparql11Listener.prototype.enterQuadPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#quadPattern.
Sparql11Listener.prototype.exitQuadPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#quadData.
Sparql11Listener.prototype.enterQuadData = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#quadData.
Sparql11Listener.prototype.exitQuadData = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#quads.
Sparql11Listener.prototype.enterQuads = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#quads.
Sparql11Listener.prototype.exitQuads = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#quadsNotTriples.
Sparql11Listener.prototype.enterQuadsNotTriples = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#quadsNotTriples.
Sparql11Listener.prototype.exitQuadsNotTriples = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesTemplate.
Sparql11Listener.prototype.enterTriplesTemplate = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesTemplate.
Sparql11Listener.prototype.exitTriplesTemplate = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#groupGraphPattern.
Sparql11Listener.prototype.enterGroupGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#groupGraphPattern.
Sparql11Listener.prototype.exitGroupGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#groupGraphPatternSub.
Sparql11Listener.prototype.enterGroupGraphPatternSub = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#groupGraphPatternSub.
Sparql11Listener.prototype.exitGroupGraphPatternSub = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesBlock.
Sparql11Listener.prototype.enterTriplesBlock = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesBlock.
Sparql11Listener.prototype.exitTriplesBlock = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphPatternNotTriples.
Sparql11Listener.prototype.enterGraphPatternNotTriples = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphPatternNotTriples.
Sparql11Listener.prototype.exitGraphPatternNotTriples = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#optionalGraphPattern.
Sparql11Listener.prototype.enterOptionalGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#optionalGraphPattern.
Sparql11Listener.prototype.exitOptionalGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphGraphPattern.
Sparql11Listener.prototype.enterGraphGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphGraphPattern.
Sparql11Listener.prototype.exitGraphGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#serviceGraphPattern.
Sparql11Listener.prototype.enterServiceGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#serviceGraphPattern.
Sparql11Listener.prototype.exitServiceGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#bind.
Sparql11Listener.prototype.enterBind = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#bind.
Sparql11Listener.prototype.exitBind = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#inlineData.
Sparql11Listener.prototype.enterInlineData = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#inlineData.
Sparql11Listener.prototype.exitInlineData = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#dataBlock.
Sparql11Listener.prototype.enterDataBlock = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#dataBlock.
Sparql11Listener.prototype.exitDataBlock = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#inlineDataOneVar.
Sparql11Listener.prototype.enterInlineDataOneVar = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#inlineDataOneVar.
Sparql11Listener.prototype.exitInlineDataOneVar = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#inlineDataFull.
Sparql11Listener.prototype.enterInlineDataFull = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#inlineDataFull.
Sparql11Listener.prototype.exitInlineDataFull = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#dataBlockValue.
Sparql11Listener.prototype.enterDataBlockValue = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#dataBlockValue.
Sparql11Listener.prototype.exitDataBlockValue = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#minusGraphPattern.
Sparql11Listener.prototype.enterMinusGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#minusGraphPattern.
Sparql11Listener.prototype.exitMinusGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#groupOrUnionGraphPattern.
Sparql11Listener.prototype.enterGroupOrUnionGraphPattern = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#groupOrUnionGraphPattern.
Sparql11Listener.prototype.exitGroupOrUnionGraphPattern = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#filter.
Sparql11Listener.prototype.enterFilter = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#filter.
Sparql11Listener.prototype.exitFilter = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#constraint.
Sparql11Listener.prototype.enterConstraint = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#constraint.
Sparql11Listener.prototype.exitConstraint = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#functionCall.
Sparql11Listener.prototype.enterFunctionCall = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#functionCall.
Sparql11Listener.prototype.exitFunctionCall = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#argList.
Sparql11Listener.prototype.enterArgList = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#argList.
Sparql11Listener.prototype.exitArgList = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#expressionList.
Sparql11Listener.prototype.enterExpressionList = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#expressionList.
Sparql11Listener.prototype.exitExpressionList = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#constructTemplate.
Sparql11Listener.prototype.enterConstructTemplate = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#constructTemplate.
Sparql11Listener.prototype.exitConstructTemplate = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#constructTriples.
Sparql11Listener.prototype.enterConstructTriples = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#constructTriples.
Sparql11Listener.prototype.exitConstructTriples = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesSameSubject.
Sparql11Listener.prototype.enterTriplesSameSubject = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesSameSubject.
Sparql11Listener.prototype.exitTriplesSameSubject = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#propertyList.
Sparql11Listener.prototype.enterPropertyList = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#propertyList.
Sparql11Listener.prototype.exitPropertyList = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#propertyListNotEmpty.
Sparql11Listener.prototype.enterPropertyListNotEmpty = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#propertyListNotEmpty.
Sparql11Listener.prototype.exitPropertyListNotEmpty = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#verb.
Sparql11Listener.prototype.enterVerb = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#verb.
Sparql11Listener.prototype.exitVerb = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#objectList.
Sparql11Listener.prototype.enterObjectList = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#objectList.
Sparql11Listener.prototype.exitObjectList = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#object.
Sparql11Listener.prototype.enterObject = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#object.
Sparql11Listener.prototype.exitObject = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesSameSubjectPath.
Sparql11Listener.prototype.enterTriplesSameSubjectPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesSameSubjectPath.
Sparql11Listener.prototype.exitTriplesSameSubjectPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#propertyListPath.
Sparql11Listener.prototype.enterPropertyListPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#propertyListPath.
Sparql11Listener.prototype.exitPropertyListPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#propertyListPathNotEmpty.
Sparql11Listener.prototype.enterPropertyListPathNotEmpty = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#propertyListPathNotEmpty.
Sparql11Listener.prototype.exitPropertyListPathNotEmpty = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#verbPath.
Sparql11Listener.prototype.enterVerbPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#verbPath.
Sparql11Listener.prototype.exitVerbPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#verbSimple.
Sparql11Listener.prototype.enterVerbSimple = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#verbSimple.
Sparql11Listener.prototype.exitVerbSimple = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#objectListPath.
Sparql11Listener.prototype.enterObjectListPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#objectListPath.
Sparql11Listener.prototype.exitObjectListPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#objectPath.
Sparql11Listener.prototype.enterObjectPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#objectPath.
Sparql11Listener.prototype.exitObjectPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#path.
Sparql11Listener.prototype.enterPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#path.
Sparql11Listener.prototype.exitPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathAlternative.
Sparql11Listener.prototype.enterPathAlternative = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathAlternative.
Sparql11Listener.prototype.exitPathAlternative = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathSequence.
Sparql11Listener.prototype.enterPathSequence = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathSequence.
Sparql11Listener.prototype.exitPathSequence = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathElt.
Sparql11Listener.prototype.enterPathElt = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathElt.
Sparql11Listener.prototype.exitPathElt = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathEltOrInverse.
Sparql11Listener.prototype.enterPathEltOrInverse = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathEltOrInverse.
Sparql11Listener.prototype.exitPathEltOrInverse = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathMod.
Sparql11Listener.prototype.enterPathMod = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathMod.
Sparql11Listener.prototype.exitPathMod = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathPrimary.
Sparql11Listener.prototype.enterPathPrimary = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathPrimary.
Sparql11Listener.prototype.exitPathPrimary = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathNegatedPropertySet.
Sparql11Listener.prototype.enterPathNegatedPropertySet = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathNegatedPropertySet.
Sparql11Listener.prototype.exitPathNegatedPropertySet = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#pathOneInPropertySet.
Sparql11Listener.prototype.enterPathOneInPropertySet = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#pathOneInPropertySet.
Sparql11Listener.prototype.exitPathOneInPropertySet = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#integer.
Sparql11Listener.prototype.enterInteger = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#integer.
Sparql11Listener.prototype.exitInteger = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesNode.
Sparql11Listener.prototype.enterTriplesNode = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesNode.
Sparql11Listener.prototype.exitTriplesNode = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#blankNodePropertyList.
Sparql11Listener.prototype.enterBlankNodePropertyList = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#blankNodePropertyList.
Sparql11Listener.prototype.exitBlankNodePropertyList = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#triplesNodePath.
Sparql11Listener.prototype.enterTriplesNodePath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#triplesNodePath.
Sparql11Listener.prototype.exitTriplesNodePath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#blankNodePropertyListPath.
Sparql11Listener.prototype.enterBlankNodePropertyListPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#blankNodePropertyListPath.
Sparql11Listener.prototype.exitBlankNodePropertyListPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#collection.
Sparql11Listener.prototype.enterCollection = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#collection.
Sparql11Listener.prototype.exitCollection = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#collectionPath.
Sparql11Listener.prototype.enterCollectionPath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#collectionPath.
Sparql11Listener.prototype.exitCollectionPath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphNode.
Sparql11Listener.prototype.enterGraphNode = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphNode.
Sparql11Listener.prototype.exitGraphNode = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphNodePath.
Sparql11Listener.prototype.enterGraphNodePath = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphNodePath.
Sparql11Listener.prototype.exitGraphNodePath = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#varOrTerm.
Sparql11Listener.prototype.enterVarOrTerm = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#varOrTerm.
Sparql11Listener.prototype.exitVarOrTerm = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#varOrIriRef.
Sparql11Listener.prototype.enterVarOrIriRef = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#varOrIriRef.
Sparql11Listener.prototype.exitVarOrIriRef = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#var.
Sparql11Listener.prototype.enterVar = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#var.
Sparql11Listener.prototype.exitVar = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#graphTerm.
Sparql11Listener.prototype.enterGraphTerm = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#graphTerm.
Sparql11Listener.prototype.exitGraphTerm = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#expression.
Sparql11Listener.prototype.enterExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#expression.
Sparql11Listener.prototype.exitExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#conditionalOrExpression.
Sparql11Listener.prototype.enterConditionalOrExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#conditionalOrExpression.
Sparql11Listener.prototype.exitConditionalOrExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#conditionalAndExpression.
Sparql11Listener.prototype.enterConditionalAndExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#conditionalAndExpression.
Sparql11Listener.prototype.exitConditionalAndExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#valueLogical.
Sparql11Listener.prototype.enterValueLogical = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#valueLogical.
Sparql11Listener.prototype.exitValueLogical = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#relationalExpression.
Sparql11Listener.prototype.enterRelationalExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#relationalExpression.
Sparql11Listener.prototype.exitRelationalExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#numericExpression.
Sparql11Listener.prototype.enterNumericExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#numericExpression.
Sparql11Listener.prototype.exitNumericExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#additiveExpression.
Sparql11Listener.prototype.enterAdditiveExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#additiveExpression.
Sparql11Listener.prototype.exitAdditiveExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#multiplicativeExpression.
Sparql11Listener.prototype.enterMultiplicativeExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#multiplicativeExpression.
Sparql11Listener.prototype.exitMultiplicativeExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#unaryExpression.
Sparql11Listener.prototype.enterUnaryExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#unaryExpression.
Sparql11Listener.prototype.exitUnaryExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#primaryExpression.
Sparql11Listener.prototype.enterPrimaryExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#primaryExpression.
Sparql11Listener.prototype.exitPrimaryExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#brackettedExpression.
Sparql11Listener.prototype.enterBrackettedExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#brackettedExpression.
Sparql11Listener.prototype.exitBrackettedExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#builtInCall.
Sparql11Listener.prototype.enterBuiltInCall = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#builtInCall.
Sparql11Listener.prototype.exitBuiltInCall = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#regexExpression.
Sparql11Listener.prototype.enterRegexExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#regexExpression.
Sparql11Listener.prototype.exitRegexExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#substringExpression.
Sparql11Listener.prototype.enterSubstringExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#substringExpression.
Sparql11Listener.prototype.exitSubstringExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#strReplaceExpression.
Sparql11Listener.prototype.enterStrReplaceExpression = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#strReplaceExpression.
Sparql11Listener.prototype.exitStrReplaceExpression = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#existsFunc.
Sparql11Listener.prototype.enterExistsFunc = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#existsFunc.
Sparql11Listener.prototype.exitExistsFunc = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#notExistsFunc.
Sparql11Listener.prototype.enterNotExistsFunc = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#notExistsFunc.
Sparql11Listener.prototype.exitNotExistsFunc = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#aggregate.
Sparql11Listener.prototype.enterAggregate = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#aggregate.
Sparql11Listener.prototype.exitAggregate = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#iriRefOrFunction.
Sparql11Listener.prototype.enterIriRefOrFunction = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#iriRefOrFunction.
Sparql11Listener.prototype.exitIriRefOrFunction = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#rdfLiteral.
Sparql11Listener.prototype.enterRdfLiteral = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#rdfLiteral.
Sparql11Listener.prototype.exitRdfLiteral = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#numericLiteral.
Sparql11Listener.prototype.enterNumericLiteral = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#numericLiteral.
Sparql11Listener.prototype.exitNumericLiteral = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#numericLiteralUnsigned.
Sparql11Listener.prototype.enterNumericLiteralUnsigned = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#numericLiteralUnsigned.
Sparql11Listener.prototype.exitNumericLiteralUnsigned = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#numericLiteralPositive.
Sparql11Listener.prototype.enterNumericLiteralPositive = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#numericLiteralPositive.
Sparql11Listener.prototype.exitNumericLiteralPositive = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#numericLiteralNegative.
Sparql11Listener.prototype.enterNumericLiteralNegative = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#numericLiteralNegative.
Sparql11Listener.prototype.exitNumericLiteralNegative = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#booleanLiteral.
Sparql11Listener.prototype.enterBooleanLiteral = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#booleanLiteral.
Sparql11Listener.prototype.exitBooleanLiteral = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#string.
Sparql11Listener.prototype.enterString = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#string.
Sparql11Listener.prototype.exitString = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#iriRef.
Sparql11Listener.prototype.enterIriRef = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#iriRef.
Sparql11Listener.prototype.exitIriRef = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#prefixedName.
Sparql11Listener.prototype.enterPrefixedName = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#prefixedName.
Sparql11Listener.prototype.exitPrefixedName = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#blankNode.
Sparql11Listener.prototype.enterBlankNode = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#blankNode.
Sparql11Listener.prototype.exitBlankNode = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#var1.
Sparql11Listener.prototype.enterVar1 = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#var1.
Sparql11Listener.prototype.exitVar1 = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#var2.
Sparql11Listener.prototype.enterVar2 = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#var2.
Sparql11Listener.prototype.exitVar2 = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#nil.
Sparql11Listener.prototype.enterNil = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#nil.
Sparql11Listener.prototype.exitNil = function(ctx) {
};


// Enter a parse tree produced by Sparql11Parser#anon.
Sparql11Listener.prototype.enterAnon = function(ctx) {
};

// Exit a parse tree produced by Sparql11Parser#anon.
Sparql11Listener.prototype.exitAnon = function(ctx) {
};



exports.Sparql11Listener = Sparql11Listener;