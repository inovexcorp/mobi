/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
// Generated from ./MOS.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { DescriptionContext } from "./MOSParser";
import { ConjunctionContext } from "./MOSParser";
import { PrimaryContext } from "./MOSParser";
import { IriContext } from "./MOSParser";
import { ObjectPropertyExpressionContext } from "./MOSParser";
import { RestrictionContext } from "./MOSParser";
import { AtomicContext } from "./MOSParser";
import { ClassIRIContext } from "./MOSParser";
import { IndividualListContext } from "./MOSParser";
import { IndividualContext } from "./MOSParser";
import { NonNegativeIntegerContext } from "./MOSParser";
import { DataPrimaryContext } from "./MOSParser";
import { DataAtomicContext } from "./MOSParser";
import { LiteralListContext } from "./MOSParser";
import { DataTypeContext } from "./MOSParser";
import { LiteralContext } from "./MOSParser";
import { TypedLiteralContext } from "./MOSParser";
import { StringLiteralNoLanguageContext } from "./MOSParser";
import { StringLiteralWithLanguageContext } from "./MOSParser";
import { LexicalValueContext } from "./MOSParser";
import { DataPropertyExpressionContext } from "./MOSParser";
import { DataTypeRestrictionContext } from "./MOSParser";
import { FacetContext } from "./MOSParser";
import { RestrictionValueContext } from "./MOSParser";
import { InverseObjectPropertyContext } from "./MOSParser";
import { DecimalLiteralContext } from "./MOSParser";
import { IntegerLiteralContext } from "./MOSParser";
import { FloatingPointLiteralContext } from "./MOSParser";
import { DataRangeContext } from "./MOSParser";
import { DataConjunctionContext } from "./MOSParser";
import { AnnotationAnnotatedListContext } from "./MOSParser";
import { AnnotationContext } from "./MOSParser";
import { AnnotationTargetContext } from "./MOSParser";
import { AnnotationsContext } from "./MOSParser";
import { DescriptionAnnotatedListContext } from "./MOSParser";
import { Description2ListContext } from "./MOSParser";
import { DescriptionListContext } from "./MOSParser";
import { ClassFrameContext } from "./MOSParser";
import { ObjectPropertyFrameContext } from "./MOSParser";
import { ObjectPropertyCharacteristicAnnotatedListContext } from "./MOSParser";
import { ObjectPropertyExpressionAnnotatedListContext } from "./MOSParser";
import { DataPropertyFrameContext } from "./MOSParser";
import { DataRangeAnnotatedListContext } from "./MOSParser";
import { DataPropertyExpressionAnnotatedListContext } from "./MOSParser";
import { AnnotationPropertyFrameContext } from "./MOSParser";
import { IriAnnotatedListContext } from "./MOSParser";
import { AnnotationPropertyIRIContext } from "./MOSParser";
import { AnnotationPropertyIRIAnnotatedListContext } from "./MOSParser";
import { IndividualFrameContext } from "./MOSParser";
import { FactAnnotatedListContext } from "./MOSParser";
import { IndividualAnnotatedListContext } from "./MOSParser";
import { FactContext } from "./MOSParser";
import { ObjectPropertyFactContext } from "./MOSParser";
import { DataPropertyFactContext } from "./MOSParser";
import { DatatypeFrameContext } from "./MOSParser";
import { MiscContext } from "./MOSParser";
import { Individual2ListContext } from "./MOSParser";
import { DataProperty2ListContext } from "./MOSParser";
import { DataPropertyListContext } from "./MOSParser";
import { ObjectProperty2ListContext } from "./MOSParser";
import { ObjectPropertyListContext } from "./MOSParser";
import { ObjectPropertyContext } from "./MOSParser";
import { DataPropertyContext } from "./MOSParser";
import { DataPropertyIRIContext } from "./MOSParser";
import { DatatypeIRIContext } from "./MOSParser";
import { ObjectPropertyIRIContext } from "./MOSParser";
import { FrameContext } from "./MOSParser";
import { EntityContext } from "./MOSParser";
import { IndividualIRIContext } from "./MOSParser";
import { DatatypePropertyIRIContext } from "./MOSParser";
import { OntologyDocumentContext } from "./MOSParser";
import { PrefixDeclarationContext } from "./MOSParser";
import { OntologyContext } from "./MOSParser";
import { OntologyIriContext } from "./MOSParser";
import { VersionIriContext } from "./MOSParser";
import { ImportsContext } from "./MOSParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `MOSParser`.
 */
export interface MOSListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `MOSParser.description`.
	 * @param ctx the parse tree
	 */
	enterDescription?: (ctx: DescriptionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.description`.
	 * @param ctx the parse tree
	 */
	exitDescription?: (ctx: DescriptionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.conjunction`.
	 * @param ctx the parse tree
	 */
	enterConjunction?: (ctx: ConjunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.conjunction`.
	 * @param ctx the parse tree
	 */
	exitConjunction?: (ctx: ConjunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.primary`.
	 * @param ctx the parse tree
	 */
	enterPrimary?: (ctx: PrimaryContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.primary`.
	 * @param ctx the parse tree
	 */
	exitPrimary?: (ctx: PrimaryContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.iri`.
	 * @param ctx the parse tree
	 */
	enterIri?: (ctx: IriContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.iri`.
	 * @param ctx the parse tree
	 */
	exitIri?: (ctx: IriContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyExpression`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyExpression?: (ctx: ObjectPropertyExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyExpression`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyExpression?: (ctx: ObjectPropertyExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.restriction`.
	 * @param ctx the parse tree
	 */
	enterRestriction?: (ctx: RestrictionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.restriction`.
	 * @param ctx the parse tree
	 */
	exitRestriction?: (ctx: RestrictionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.atomic`.
	 * @param ctx the parse tree
	 */
	enterAtomic?: (ctx: AtomicContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.atomic`.
	 * @param ctx the parse tree
	 */
	exitAtomic?: (ctx: AtomicContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.classIRI`.
	 * @param ctx the parse tree
	 */
	enterClassIRI?: (ctx: ClassIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.classIRI`.
	 * @param ctx the parse tree
	 */
	exitClassIRI?: (ctx: ClassIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individualList`.
	 * @param ctx the parse tree
	 */
	enterIndividualList?: (ctx: IndividualListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individualList`.
	 * @param ctx the parse tree
	 */
	exitIndividualList?: (ctx: IndividualListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individual`.
	 * @param ctx the parse tree
	 */
	enterIndividual?: (ctx: IndividualContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individual`.
	 * @param ctx the parse tree
	 */
	exitIndividual?: (ctx: IndividualContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.nonNegativeInteger`.
	 * @param ctx the parse tree
	 */
	enterNonNegativeInteger?: (ctx: NonNegativeIntegerContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.nonNegativeInteger`.
	 * @param ctx the parse tree
	 */
	exitNonNegativeInteger?: (ctx: NonNegativeIntegerContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPrimary`.
	 * @param ctx the parse tree
	 */
	enterDataPrimary?: (ctx: DataPrimaryContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPrimary`.
	 * @param ctx the parse tree
	 */
	exitDataPrimary?: (ctx: DataPrimaryContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataAtomic`.
	 * @param ctx the parse tree
	 */
	enterDataAtomic?: (ctx: DataAtomicContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataAtomic`.
	 * @param ctx the parse tree
	 */
	exitDataAtomic?: (ctx: DataAtomicContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.literalList`.
	 * @param ctx the parse tree
	 */
	enterLiteralList?: (ctx: LiteralListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.literalList`.
	 * @param ctx the parse tree
	 */
	exitLiteralList?: (ctx: LiteralListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataType`.
	 * @param ctx the parse tree
	 */
	enterDataType?: (ctx: DataTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataType`.
	 * @param ctx the parse tree
	 */
	exitDataType?: (ctx: DataTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.literal`.
	 * @param ctx the parse tree
	 */
	enterLiteral?: (ctx: LiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.literal`.
	 * @param ctx the parse tree
	 */
	exitLiteral?: (ctx: LiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.typedLiteral`.
	 * @param ctx the parse tree
	 */
	enterTypedLiteral?: (ctx: TypedLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.typedLiteral`.
	 * @param ctx the parse tree
	 */
	exitTypedLiteral?: (ctx: TypedLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.stringLiteralNoLanguage`.
	 * @param ctx the parse tree
	 */
	enterStringLiteralNoLanguage?: (ctx: StringLiteralNoLanguageContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.stringLiteralNoLanguage`.
	 * @param ctx the parse tree
	 */
	exitStringLiteralNoLanguage?: (ctx: StringLiteralNoLanguageContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.stringLiteralWithLanguage`.
	 * @param ctx the parse tree
	 */
	enterStringLiteralWithLanguage?: (ctx: StringLiteralWithLanguageContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.stringLiteralWithLanguage`.
	 * @param ctx the parse tree
	 */
	exitStringLiteralWithLanguage?: (ctx: StringLiteralWithLanguageContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.lexicalValue`.
	 * @param ctx the parse tree
	 */
	enterLexicalValue?: (ctx: LexicalValueContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.lexicalValue`.
	 * @param ctx the parse tree
	 */
	exitLexicalValue?: (ctx: LexicalValueContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyExpression`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyExpression?: (ctx: DataPropertyExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyExpression`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyExpression?: (ctx: DataPropertyExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataTypeRestriction`.
	 * @param ctx the parse tree
	 */
	enterDataTypeRestriction?: (ctx: DataTypeRestrictionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataTypeRestriction`.
	 * @param ctx the parse tree
	 */
	exitDataTypeRestriction?: (ctx: DataTypeRestrictionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.facet`.
	 * @param ctx the parse tree
	 */
	enterFacet?: (ctx: FacetContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.facet`.
	 * @param ctx the parse tree
	 */
	exitFacet?: (ctx: FacetContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.restrictionValue`.
	 * @param ctx the parse tree
	 */
	enterRestrictionValue?: (ctx: RestrictionValueContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.restrictionValue`.
	 * @param ctx the parse tree
	 */
	exitRestrictionValue?: (ctx: RestrictionValueContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.inverseObjectProperty`.
	 * @param ctx the parse tree
	 */
	enterInverseObjectProperty?: (ctx: InverseObjectPropertyContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.inverseObjectProperty`.
	 * @param ctx the parse tree
	 */
	exitInverseObjectProperty?: (ctx: InverseObjectPropertyContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.decimalLiteral`.
	 * @param ctx the parse tree
	 */
	enterDecimalLiteral?: (ctx: DecimalLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.decimalLiteral`.
	 * @param ctx the parse tree
	 */
	exitDecimalLiteral?: (ctx: DecimalLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.integerLiteral`.
	 * @param ctx the parse tree
	 */
	enterIntegerLiteral?: (ctx: IntegerLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.integerLiteral`.
	 * @param ctx the parse tree
	 */
	exitIntegerLiteral?: (ctx: IntegerLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.floatingPointLiteral`.
	 * @param ctx the parse tree
	 */
	enterFloatingPointLiteral?: (ctx: FloatingPointLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.floatingPointLiteral`.
	 * @param ctx the parse tree
	 */
	exitFloatingPointLiteral?: (ctx: FloatingPointLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataRange`.
	 * @param ctx the parse tree
	 */
	enterDataRange?: (ctx: DataRangeContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataRange`.
	 * @param ctx the parse tree
	 */
	exitDataRange?: (ctx: DataRangeContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataConjunction`.
	 * @param ctx the parse tree
	 */
	enterDataConjunction?: (ctx: DataConjunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataConjunction`.
	 * @param ctx the parse tree
	 */
	exitDataConjunction?: (ctx: DataConjunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotationAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterAnnotationAnnotatedList?: (ctx: AnnotationAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotationAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitAnnotationAnnotatedList?: (ctx: AnnotationAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotation`.
	 * @param ctx the parse tree
	 */
	enterAnnotation?: (ctx: AnnotationContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotation`.
	 * @param ctx the parse tree
	 */
	exitAnnotation?: (ctx: AnnotationContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotationTarget`.
	 * @param ctx the parse tree
	 */
	enterAnnotationTarget?: (ctx: AnnotationTargetContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotationTarget`.
	 * @param ctx the parse tree
	 */
	exitAnnotationTarget?: (ctx: AnnotationTargetContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotations`.
	 * @param ctx the parse tree
	 */
	enterAnnotations?: (ctx: AnnotationsContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotations`.
	 * @param ctx the parse tree
	 */
	exitAnnotations?: (ctx: AnnotationsContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.descriptionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterDescriptionAnnotatedList?: (ctx: DescriptionAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.descriptionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitDescriptionAnnotatedList?: (ctx: DescriptionAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.description2List`.
	 * @param ctx the parse tree
	 */
	enterDescription2List?: (ctx: Description2ListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.description2List`.
	 * @param ctx the parse tree
	 */
	exitDescription2List?: (ctx: Description2ListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.descriptionList`.
	 * @param ctx the parse tree
	 */
	enterDescriptionList?: (ctx: DescriptionListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.descriptionList`.
	 * @param ctx the parse tree
	 */
	exitDescriptionList?: (ctx: DescriptionListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.classFrame`.
	 * @param ctx the parse tree
	 */
	enterClassFrame?: (ctx: ClassFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.classFrame`.
	 * @param ctx the parse tree
	 */
	exitClassFrame?: (ctx: ClassFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyFrame`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyFrame?: (ctx: ObjectPropertyFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyFrame`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyFrame?: (ctx: ObjectPropertyFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyCharacteristicAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyCharacteristicAnnotatedList?: (ctx: ObjectPropertyCharacteristicAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyCharacteristicAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyCharacteristicAnnotatedList?: (ctx: ObjectPropertyCharacteristicAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyExpressionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyExpressionAnnotatedList?: (ctx: ObjectPropertyExpressionAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyExpressionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyExpressionAnnotatedList?: (ctx: ObjectPropertyExpressionAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyFrame`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyFrame?: (ctx: DataPropertyFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyFrame`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyFrame?: (ctx: DataPropertyFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataRangeAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterDataRangeAnnotatedList?: (ctx: DataRangeAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataRangeAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitDataRangeAnnotatedList?: (ctx: DataRangeAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyExpressionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyExpressionAnnotatedList?: (ctx: DataPropertyExpressionAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyExpressionAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyExpressionAnnotatedList?: (ctx: DataPropertyExpressionAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotationPropertyFrame`.
	 * @param ctx the parse tree
	 */
	enterAnnotationPropertyFrame?: (ctx: AnnotationPropertyFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotationPropertyFrame`.
	 * @param ctx the parse tree
	 */
	exitAnnotationPropertyFrame?: (ctx: AnnotationPropertyFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.iriAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterIriAnnotatedList?: (ctx: IriAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.iriAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitIriAnnotatedList?: (ctx: IriAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotationPropertyIRI`.
	 * @param ctx the parse tree
	 */
	enterAnnotationPropertyIRI?: (ctx: AnnotationPropertyIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotationPropertyIRI`.
	 * @param ctx the parse tree
	 */
	exitAnnotationPropertyIRI?: (ctx: AnnotationPropertyIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.annotationPropertyIRIAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterAnnotationPropertyIRIAnnotatedList?: (ctx: AnnotationPropertyIRIAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.annotationPropertyIRIAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitAnnotationPropertyIRIAnnotatedList?: (ctx: AnnotationPropertyIRIAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individualFrame`.
	 * @param ctx the parse tree
	 */
	enterIndividualFrame?: (ctx: IndividualFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individualFrame`.
	 * @param ctx the parse tree
	 */
	exitIndividualFrame?: (ctx: IndividualFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.factAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterFactAnnotatedList?: (ctx: FactAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.factAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitFactAnnotatedList?: (ctx: FactAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individualAnnotatedList`.
	 * @param ctx the parse tree
	 */
	enterIndividualAnnotatedList?: (ctx: IndividualAnnotatedListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individualAnnotatedList`.
	 * @param ctx the parse tree
	 */
	exitIndividualAnnotatedList?: (ctx: IndividualAnnotatedListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.fact`.
	 * @param ctx the parse tree
	 */
	enterFact?: (ctx: FactContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.fact`.
	 * @param ctx the parse tree
	 */
	exitFact?: (ctx: FactContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyFact`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyFact?: (ctx: ObjectPropertyFactContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyFact`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyFact?: (ctx: ObjectPropertyFactContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyFact`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyFact?: (ctx: DataPropertyFactContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyFact`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyFact?: (ctx: DataPropertyFactContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.datatypeFrame`.
	 * @param ctx the parse tree
	 */
	enterDatatypeFrame?: (ctx: DatatypeFrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.datatypeFrame`.
	 * @param ctx the parse tree
	 */
	exitDatatypeFrame?: (ctx: DatatypeFrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.misc`.
	 * @param ctx the parse tree
	 */
	enterMisc?: (ctx: MiscContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.misc`.
	 * @param ctx the parse tree
	 */
	exitMisc?: (ctx: MiscContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individual2List`.
	 * @param ctx the parse tree
	 */
	enterIndividual2List?: (ctx: Individual2ListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individual2List`.
	 * @param ctx the parse tree
	 */
	exitIndividual2List?: (ctx: Individual2ListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataProperty2List`.
	 * @param ctx the parse tree
	 */
	enterDataProperty2List?: (ctx: DataProperty2ListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataProperty2List`.
	 * @param ctx the parse tree
	 */
	exitDataProperty2List?: (ctx: DataProperty2ListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyList`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyList?: (ctx: DataPropertyListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyList`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyList?: (ctx: DataPropertyListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectProperty2List`.
	 * @param ctx the parse tree
	 */
	enterObjectProperty2List?: (ctx: ObjectProperty2ListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectProperty2List`.
	 * @param ctx the parse tree
	 */
	exitObjectProperty2List?: (ctx: ObjectProperty2ListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyList`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyList?: (ctx: ObjectPropertyListContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyList`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyList?: (ctx: ObjectPropertyListContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectProperty`.
	 * @param ctx the parse tree
	 */
	enterObjectProperty?: (ctx: ObjectPropertyContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectProperty`.
	 * @param ctx the parse tree
	 */
	exitObjectProperty?: (ctx: ObjectPropertyContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataProperty`.
	 * @param ctx the parse tree
	 */
	enterDataProperty?: (ctx: DataPropertyContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataProperty`.
	 * @param ctx the parse tree
	 */
	exitDataProperty?: (ctx: DataPropertyContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.dataPropertyIRI`.
	 * @param ctx the parse tree
	 */
	enterDataPropertyIRI?: (ctx: DataPropertyIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.dataPropertyIRI`.
	 * @param ctx the parse tree
	 */
	exitDataPropertyIRI?: (ctx: DataPropertyIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.datatypeIRI`.
	 * @param ctx the parse tree
	 */
	enterDatatypeIRI?: (ctx: DatatypeIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.datatypeIRI`.
	 * @param ctx the parse tree
	 */
	exitDatatypeIRI?: (ctx: DatatypeIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.objectPropertyIRI`.
	 * @param ctx the parse tree
	 */
	enterObjectPropertyIRI?: (ctx: ObjectPropertyIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.objectPropertyIRI`.
	 * @param ctx the parse tree
	 */
	exitObjectPropertyIRI?: (ctx: ObjectPropertyIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.frame`.
	 * @param ctx the parse tree
	 */
	enterFrame?: (ctx: FrameContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.frame`.
	 * @param ctx the parse tree
	 */
	exitFrame?: (ctx: FrameContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.entity`.
	 * @param ctx the parse tree
	 */
	enterEntity?: (ctx: EntityContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.entity`.
	 * @param ctx the parse tree
	 */
	exitEntity?: (ctx: EntityContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.individualIRI`.
	 * @param ctx the parse tree
	 */
	enterIndividualIRI?: (ctx: IndividualIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.individualIRI`.
	 * @param ctx the parse tree
	 */
	exitIndividualIRI?: (ctx: IndividualIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.datatypePropertyIRI`.
	 * @param ctx the parse tree
	 */
	enterDatatypePropertyIRI?: (ctx: DatatypePropertyIRIContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.datatypePropertyIRI`.
	 * @param ctx the parse tree
	 */
	exitDatatypePropertyIRI?: (ctx: DatatypePropertyIRIContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.ontologyDocument`.
	 * @param ctx the parse tree
	 */
	enterOntologyDocument?: (ctx: OntologyDocumentContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.ontologyDocument`.
	 * @param ctx the parse tree
	 */
	exitOntologyDocument?: (ctx: OntologyDocumentContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.prefixDeclaration`.
	 * @param ctx the parse tree
	 */
	enterPrefixDeclaration?: (ctx: PrefixDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.prefixDeclaration`.
	 * @param ctx the parse tree
	 */
	exitPrefixDeclaration?: (ctx: PrefixDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.ontology`.
	 * @param ctx the parse tree
	 */
	enterOntology?: (ctx: OntologyContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.ontology`.
	 * @param ctx the parse tree
	 */
	exitOntology?: (ctx: OntologyContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.ontologyIri`.
	 * @param ctx the parse tree
	 */
	enterOntologyIri?: (ctx: OntologyIriContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.ontologyIri`.
	 * @param ctx the parse tree
	 */
	exitOntologyIri?: (ctx: OntologyIriContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.versionIri`.
	 * @param ctx the parse tree
	 */
	enterVersionIri?: (ctx: VersionIriContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.versionIri`.
	 * @param ctx the parse tree
	 */
	exitVersionIri?: (ctx: VersionIriContext) => void;

	/**
	 * Enter a parse tree produced by `MOSParser.imports`.
	 * @param ctx the parse tree
	 */
	enterImports?: (ctx: ImportsContext) => void;
	/**
	 * Exit a parse tree produced by `MOSParser.imports`.
	 * @param ctx the parse tree
	 */
	exitImports?: (ctx: ImportsContext) => void;
}

