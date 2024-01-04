/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { MOSListener } from "./MOSListener";

export class MOSParser extends Parser {
	public static readonly LOWER_FLOAT_SUFFIX = 1;
	public static readonly UPPER_FLOAT_SUFFIX = 2;
	public static readonly O_LABEL = 3;
	public static readonly LENGTH_LABEL = 4;
	public static readonly MIN_LENGTH_LABEL = 5;
	public static readonly MAX_LENGTH_LABEL = 6;
	public static readonly PATTERN_LABEL = 7;
	public static readonly LANG_PATTERN_LABEL = 8;
	public static readonly THAT_LABEL = 9;
	public static readonly INVERSE_LABEL = 10;
	public static readonly MINUS = 11;
	public static readonly DOT = 12;
	public static readonly PLUS = 13;
	public static readonly DIGITS = 14;
	public static readonly NOT_LABEL = 15;
	public static readonly WS = 16;
	public static readonly LESS_EQUAL = 17;
	public static readonly GREATER_EQUAL = 18;
	public static readonly LESS = 19;
	public static readonly GREATER = 20;
	public static readonly OPEN_CURLY_BRACE = 21;
	public static readonly CLOSE_CURLY_BRACE = 22;
	public static readonly OR_LABEL = 23;
	public static readonly AND_LABEL = 24;
	public static readonly SOME_LABEL = 25;
	public static readonly ONLY_LABEL = 26;
	public static readonly VALUE_LABEL = 27;
	public static readonly SELF_LABEL = 28;
	public static readonly MIN_LABEL = 29;
	public static readonly MAX_LABEL = 30;
	public static readonly EXACTLY_LABEL = 31;
	public static readonly COMMA = 32;
	public static readonly OPEN_BRACE = 33;
	public static readonly CLOSE_BRACE = 34;
	public static readonly INTEGER_LABEL = 35;
	public static readonly DECIMAL_LABEL = 36;
	public static readonly FLOAT_LABEL = 37;
	public static readonly STRING_LABEL = 38;
	public static readonly REFERENCE = 39;
	public static readonly RANGE_LABEL = 40;
	public static readonly CHARACTERISTICS_LABEL = 41;
	public static readonly SUB_PROPERTY_OF_LABEL = 42;
	public static readonly SUB_PROPERTY_CHAIN_LABEL = 43;
	public static readonly OBJECT_PROPERTY_LABEL = 44;
	public static readonly DATA_PROPERTY_LABEL = 45;
	public static readonly ANNOTATION_PROPERTY_LABEL = 46;
	public static readonly NAMED_INDIVIDUAL_LABEL = 47;
	public static readonly PREFIX_LABEL = 48;
	public static readonly ONTOLOGY_LABEL = 49;
	public static readonly INDIVIDUAL_LABEL = 50;
	public static readonly TYPES_LABEL = 51;
	public static readonly FACTS_LABEL = 52;
	public static readonly SAME_AS_LABEL = 53;
	public static readonly DIFFERENET_FROM_LABEL = 54;
	public static readonly DATATYPE_LABEL = 55;
	public static readonly EQUIVALENT_CLASSES_LABEL = 56;
	public static readonly DISJOINT_CLASSES_LABEL = 57;
	public static readonly EQUIVALENT_PROPERTIES_LABEL = 58;
	public static readonly DISJOINT_PROPERTIES_LABEL = 59;
	public static readonly SAME_INDIVIDUAL_LABEL = 60;
	public static readonly DIFFERENT_INDIVIDUALS_LABEL = 61;
	public static readonly EQUIVALENT_TO_LABEL = 62;
	public static readonly SUBCLASS_OF_LABEL = 63;
	public static readonly DISJOINT_WITH_LABEL = 64;
	public static readonly DISJOINT_UNION_OF_LABEL = 65;
	public static readonly HAS_KEY_LABEL = 66;
	public static readonly INVERSE_OF_LABEL = 67;
	public static readonly IMPORT_LABEL = 68;
	public static readonly ANNOTATIONS_LABEL = 69;
	public static readonly CLASS_LABEL = 70;
	public static readonly OBJECT_PROPERTY_CHARACTERISTIC = 71;
	public static readonly FULL_IRI = 72;
	public static readonly NODE_ID = 73;
	public static readonly OPEN_SQUARE_BRACE = 74;
	public static readonly CLOSE_SQUARE_BRACE = 75;
	public static readonly QUOTED_STRING = 76;
	public static readonly LANGUAGE_TAG = 77;
	public static readonly EXPONENT = 78;
	public static readonly PREFIX_NAME = 79;
	public static readonly ABBREVIATED_IRI = 80;
	public static readonly SIMPLE_IRI = 81;
	public static readonly DOMAIN_LABEL = 82;
	public static readonly FUNCTIONAL_LABEL = 83;
	public static readonly RULE_description = 0;
	public static readonly RULE_conjunction = 1;
	public static readonly RULE_primary = 2;
	public static readonly RULE_iri = 3;
	public static readonly RULE_objectPropertyExpression = 4;
	public static readonly RULE_restriction = 5;
	public static readonly RULE_atomic = 6;
	public static readonly RULE_classIRI = 7;
	public static readonly RULE_individualList = 8;
	public static readonly RULE_individual = 9;
	public static readonly RULE_nonNegativeInteger = 10;
	public static readonly RULE_dataPrimary = 11;
	public static readonly RULE_dataAtomic = 12;
	public static readonly RULE_literalList = 13;
	public static readonly RULE_dataType = 14;
	public static readonly RULE_literal = 15;
	public static readonly RULE_typedLiteral = 16;
	public static readonly RULE_stringLiteralNoLanguage = 17;
	public static readonly RULE_stringLiteralWithLanguage = 18;
	public static readonly RULE_lexicalValue = 19;
	public static readonly RULE_dataPropertyExpression = 20;
	public static readonly RULE_dataTypeRestriction = 21;
	public static readonly RULE_facet = 22;
	public static readonly RULE_restrictionValue = 23;
	public static readonly RULE_inverseObjectProperty = 24;
	public static readonly RULE_decimalLiteral = 25;
	public static readonly RULE_integerLiteral = 26;
	public static readonly RULE_floatingPointLiteral = 27;
	public static readonly RULE_dataRange = 28;
	public static readonly RULE_dataConjunction = 29;
	public static readonly RULE_annotationAnnotatedList = 30;
	public static readonly RULE_annotation = 31;
	public static readonly RULE_annotationTarget = 32;
	public static readonly RULE_annotations = 33;
	public static readonly RULE_descriptionAnnotatedList = 34;
	public static readonly RULE_description2List = 35;
	public static readonly RULE_descriptionList = 36;
	public static readonly RULE_classFrame = 37;
	public static readonly RULE_objectPropertyFrame = 38;
	public static readonly RULE_objectPropertyCharacteristicAnnotatedList = 39;
	public static readonly RULE_objectPropertyExpressionAnnotatedList = 40;
	public static readonly RULE_dataPropertyFrame = 41;
	public static readonly RULE_dataRangeAnnotatedList = 42;
	public static readonly RULE_dataPropertyExpressionAnnotatedList = 43;
	public static readonly RULE_annotationPropertyFrame = 44;
	public static readonly RULE_iriAnnotatedList = 45;
	public static readonly RULE_annotationPropertyIRI = 46;
	public static readonly RULE_annotationPropertyIRIAnnotatedList = 47;
	public static readonly RULE_individualFrame = 48;
	public static readonly RULE_factAnnotatedList = 49;
	public static readonly RULE_individualAnnotatedList = 50;
	public static readonly RULE_fact = 51;
	public static readonly RULE_objectPropertyFact = 52;
	public static readonly RULE_dataPropertyFact = 53;
	public static readonly RULE_datatypeFrame = 54;
	public static readonly RULE_misc = 55;
	public static readonly RULE_individual2List = 56;
	public static readonly RULE_dataProperty2List = 57;
	public static readonly RULE_dataPropertyList = 58;
	public static readonly RULE_objectProperty2List = 59;
	public static readonly RULE_objectPropertyList = 60;
	public static readonly RULE_objectProperty = 61;
	public static readonly RULE_dataProperty = 62;
	public static readonly RULE_dataPropertyIRI = 63;
	public static readonly RULE_datatypeIRI = 64;
	public static readonly RULE_objectPropertyIRI = 65;
	public static readonly RULE_frame = 66;
	public static readonly RULE_entity = 67;
	public static readonly RULE_individualIRI = 68;
	public static readonly RULE_datatypePropertyIRI = 69;
	public static readonly RULE_ontologyDocument = 70;
	public static readonly RULE_prefixDeclaration = 71;
	public static readonly RULE_ontology = 72;
	public static readonly RULE_ontologyIri = 73;
	public static readonly RULE_versionIri = 74;
	public static readonly RULE_imports = 75;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"description", "conjunction", "primary", "iri", "objectPropertyExpression", 
		"restriction", "atomic", "classIRI", "individualList", "individual", "nonNegativeInteger", 
		"dataPrimary", "dataAtomic", "literalList", "dataType", "literal", "typedLiteral", 
		"stringLiteralNoLanguage", "stringLiteralWithLanguage", "lexicalValue", 
		"dataPropertyExpression", "dataTypeRestriction", "facet", "restrictionValue", 
		"inverseObjectProperty", "decimalLiteral", "integerLiteral", "floatingPointLiteral", 
		"dataRange", "dataConjunction", "annotationAnnotatedList", "annotation", 
		"annotationTarget", "annotations", "descriptionAnnotatedList", "description2List", 
		"descriptionList", "classFrame", "objectPropertyFrame", "objectPropertyCharacteristicAnnotatedList", 
		"objectPropertyExpressionAnnotatedList", "dataPropertyFrame", "dataRangeAnnotatedList", 
		"dataPropertyExpressionAnnotatedList", "annotationPropertyFrame", "iriAnnotatedList", 
		"annotationPropertyIRI", "annotationPropertyIRIAnnotatedList", "individualFrame", 
		"factAnnotatedList", "individualAnnotatedList", "fact", "objectPropertyFact", 
		"dataPropertyFact", "datatypeFrame", "misc", "individual2List", "dataProperty2List", 
		"dataPropertyList", "objectProperty2List", "objectPropertyList", "objectProperty", 
		"dataProperty", "dataPropertyIRI", "datatypeIRI", "objectPropertyIRI", 
		"frame", "entity", "individualIRI", "datatypePropertyIRI", "ontologyDocument", 
		"prefixDeclaration", "ontology", "ontologyIri", "versionIri", "imports",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'f'", "'F'", "'o'", "'length'", "'minLength'", "'maxLength'", 
		"'pattern'", "'langPattern'", "'that'", "'inverse'", "'-'", "'.'", "'+'", 
		undefined, "'not'", undefined, "'<='", "'>='", "'<'", "'>'", "'{'", "'}'", 
		"'or'", "'and'", "'some'", "'only'", "'value'", "'Self'", "'min'", "'max'", 
		"'exactly'", "','", "'('", "')'", "'integer'", "'decimal'", "'float'", 
		"'string'", "'^^'", "'Range:'", "'Characteristics:'", "'SubPropertyOf:'", 
		"'SubPropertyChain:'", "'ObjectProperty:'", "'DataProperty:'", "'AnnotationProperty:'", 
		"'NamedIndividual'", "'Prefix:'", "'Ontology:'", "'Individual:'", "'Types:'", 
		"'Facts:'", "'SameAs:'", "'DifferentFrom:'", "'Datatype:'", "'EquivalentClasses:'", 
		"'DisjointClasses:'", "'EquivalentProperties:'", "'DisjointProperties:'", 
		"'SameIndividual:'", "'DifferentIndividuals:'", "'EquivalentTo:'", "'SubClassOf:'", 
		"'DisjointWith:'", "'DisjointUnionOf:'", "'HasKey:'", "'InverseOf:'", 
		"'Import:'", "'Annotations:'", "'Class:'", undefined, undefined, undefined, 
		"'['", "']'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "LOWER_FLOAT_SUFFIX", "UPPER_FLOAT_SUFFIX", "O_LABEL", "LENGTH_LABEL", 
		"MIN_LENGTH_LABEL", "MAX_LENGTH_LABEL", "PATTERN_LABEL", "LANG_PATTERN_LABEL", 
		"THAT_LABEL", "INVERSE_LABEL", "MINUS", "DOT", "PLUS", "DIGITS", "NOT_LABEL", 
		"WS", "LESS_EQUAL", "GREATER_EQUAL", "LESS", "GREATER", "OPEN_CURLY_BRACE", 
		"CLOSE_CURLY_BRACE", "OR_LABEL", "AND_LABEL", "SOME_LABEL", "ONLY_LABEL", 
		"VALUE_LABEL", "SELF_LABEL", "MIN_LABEL", "MAX_LABEL", "EXACTLY_LABEL", 
		"COMMA", "OPEN_BRACE", "CLOSE_BRACE", "INTEGER_LABEL", "DECIMAL_LABEL", 
		"FLOAT_LABEL", "STRING_LABEL", "REFERENCE", "RANGE_LABEL", "CHARACTERISTICS_LABEL", 
		"SUB_PROPERTY_OF_LABEL", "SUB_PROPERTY_CHAIN_LABEL", "OBJECT_PROPERTY_LABEL", 
		"DATA_PROPERTY_LABEL", "ANNOTATION_PROPERTY_LABEL", "NAMED_INDIVIDUAL_LABEL", 
		"PREFIX_LABEL", "ONTOLOGY_LABEL", "INDIVIDUAL_LABEL", "TYPES_LABEL", "FACTS_LABEL", 
		"SAME_AS_LABEL", "DIFFERENET_FROM_LABEL", "DATATYPE_LABEL", "EQUIVALENT_CLASSES_LABEL", 
		"DISJOINT_CLASSES_LABEL", "EQUIVALENT_PROPERTIES_LABEL", "DISJOINT_PROPERTIES_LABEL", 
		"SAME_INDIVIDUAL_LABEL", "DIFFERENT_INDIVIDUALS_LABEL", "EQUIVALENT_TO_LABEL", 
		"SUBCLASS_OF_LABEL", "DISJOINT_WITH_LABEL", "DISJOINT_UNION_OF_LABEL", 
		"HAS_KEY_LABEL", "INVERSE_OF_LABEL", "IMPORT_LABEL", "ANNOTATIONS_LABEL", 
		"CLASS_LABEL", "OBJECT_PROPERTY_CHARACTERISTIC", "FULL_IRI", "NODE_ID", 
		"OPEN_SQUARE_BRACE", "CLOSE_SQUARE_BRACE", "QUOTED_STRING", "LANGUAGE_TAG", 
		"EXPONENT", "PREFIX_NAME", "ABBREVIATED_IRI", "SIMPLE_IRI", "DOMAIN_LABEL", 
		"FUNCTIONAL_LABEL",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(MOSParser._LITERAL_NAMES, MOSParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return MOSParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "MOS.g4"; }

	// @Override
	public get ruleNames(): string[] { return MOSParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return MOSParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(MOSParser._ATN, this);
	}
	// @RuleVersion(0)
	public description(): DescriptionContext {
		let _localctx: DescriptionContext = new DescriptionContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, MOSParser.RULE_description);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 152;
			this.conjunction();
			this.state = 157;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.OR_LABEL) {
				{
				{
				this.state = 153;
				this.match(MOSParser.OR_LABEL);
				this.state = 154;
				this.conjunction();
				}
				}
				this.state = 159;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public conjunction(): ConjunctionContext {
		let _localctx: ConjunctionContext = new ConjunctionContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, MOSParser.RULE_conjunction);
		let _la: number;
		try {
			this.state = 178;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 3, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 160;
				this.primary();
				this.state = 165;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === MOSParser.AND_LABEL) {
					{
					{
					this.state = 161;
					this.match(MOSParser.AND_LABEL);
					this.state = 162;
					this.primary();
					}
					}
					this.state = 167;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 168;
				this.classIRI();
				this.state = 169;
				this.match(MOSParser.THAT_LABEL);
				this.state = 170;
				this.primary();
				this.state = 175;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === MOSParser.AND_LABEL) {
					{
					{
					this.state = 171;
					this.match(MOSParser.AND_LABEL);
					this.state = 172;
					this.primary();
					}
					}
					this.state = 177;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public primary(): PrimaryContext {
		let _localctx: PrimaryContext = new PrimaryContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, MOSParser.RULE_primary);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 181;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.NOT_LABEL) {
				{
				this.state = 180;
				this.match(MOSParser.NOT_LABEL);
				}
			}

			this.state = 185;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 5, this._ctx) ) {
			case 1:
				{
				this.state = 183;
				this.restriction();
				}
				break;

			case 2:
				{
				this.state = 184;
				this.atomic();
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public iri(): IriContext {
		let _localctx: IriContext = new IriContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, MOSParser.RULE_iri);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 187;
			_la = this._input.LA(1);
			if (!(((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyExpression(): ObjectPropertyExpressionContext {
		let _localctx: ObjectPropertyExpressionContext = new ObjectPropertyExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, MOSParser.RULE_objectPropertyExpression);
		try {
			this.state = 191;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.FULL_IRI:
			case MOSParser.ABBREVIATED_IRI:
			case MOSParser.SIMPLE_IRI:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 189;
				this.objectPropertyIRI();
				}
				break;
			case MOSParser.INVERSE_LABEL:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 190;
				this.inverseObjectProperty();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public restriction(): RestrictionContext {
		let _localctx: RestrictionContext = new RestrictionContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, MOSParser.RULE_restriction);
		let _la: number;
		try {
			this.state = 256;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 13, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 193;
				this.objectPropertyExpression();
				this.state = 194;
				this.match(MOSParser.SOME_LABEL);
				this.state = 195;
				this.primary();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 197;
				this.objectPropertyExpression();
				this.state = 198;
				this.match(MOSParser.ONLY_LABEL);
				this.state = 199;
				this.primary();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 201;
				this.objectPropertyExpression();
				this.state = 202;
				this.match(MOSParser.VALUE_LABEL);
				this.state = 203;
				this.individual();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 205;
				this.objectPropertyExpression();
				this.state = 206;
				this.match(MOSParser.SELF_LABEL);
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 208;
				this.objectPropertyExpression();
				this.state = 209;
				this.match(MOSParser.MIN_LABEL);
				this.state = 210;
				this.nonNegativeInteger();
				this.state = 212;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 10)) & ~0x1F) === 0 && ((1 << (_la - 10)) & ((1 << (MOSParser.INVERSE_LABEL - 10)) | (1 << (MOSParser.NOT_LABEL - 10)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 10)) | (1 << (MOSParser.OPEN_BRACE - 10)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 211;
					this.primary();
					}
				}

				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 214;
				this.objectPropertyExpression();
				this.state = 215;
				this.match(MOSParser.MAX_LABEL);
				this.state = 216;
				this.nonNegativeInteger();
				this.state = 218;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 10)) & ~0x1F) === 0 && ((1 << (_la - 10)) & ((1 << (MOSParser.INVERSE_LABEL - 10)) | (1 << (MOSParser.NOT_LABEL - 10)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 10)) | (1 << (MOSParser.OPEN_BRACE - 10)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 217;
					this.primary();
					}
				}

				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 220;
				this.objectPropertyExpression();
				this.state = 221;
				this.match(MOSParser.EXACTLY_LABEL);
				this.state = 222;
				this.nonNegativeInteger();
				this.state = 224;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 10)) & ~0x1F) === 0 && ((1 << (_la - 10)) & ((1 << (MOSParser.INVERSE_LABEL - 10)) | (1 << (MOSParser.NOT_LABEL - 10)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 10)) | (1 << (MOSParser.OPEN_BRACE - 10)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 223;
					this.primary();
					}
				}

				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 226;
				this.dataPropertyExpression();
				this.state = 227;
				this.match(MOSParser.SOME_LABEL);
				this.state = 228;
				this.dataPrimary();
				}
				break;

			case 9:
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 230;
				this.dataPropertyExpression();
				this.state = 231;
				this.match(MOSParser.ONLY_LABEL);
				this.state = 232;
				this.dataPrimary();
				}
				break;

			case 10:
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 234;
				this.dataPropertyExpression();
				this.state = 235;
				this.match(MOSParser.VALUE_LABEL);
				this.state = 236;
				this.literal();
				}
				break;

			case 11:
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 238;
				this.dataPropertyExpression();
				this.state = 239;
				this.match(MOSParser.MIN_LABEL);
				this.state = 240;
				this.nonNegativeInteger();
				this.state = 242;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 15)) & ~0x1F) === 0 && ((1 << (_la - 15)) & ((1 << (MOSParser.NOT_LABEL - 15)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 15)) | (1 << (MOSParser.OPEN_BRACE - 15)) | (1 << (MOSParser.INTEGER_LABEL - 15)) | (1 << (MOSParser.DECIMAL_LABEL - 15)) | (1 << (MOSParser.FLOAT_LABEL - 15)) | (1 << (MOSParser.STRING_LABEL - 15)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 241;
					this.dataPrimary();
					}
				}

				}
				break;

			case 12:
				this.enterOuterAlt(_localctx, 12);
				{
				this.state = 244;
				this.dataPropertyExpression();
				this.state = 245;
				this.match(MOSParser.MAX_LABEL);
				this.state = 246;
				this.nonNegativeInteger();
				this.state = 248;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 15)) & ~0x1F) === 0 && ((1 << (_la - 15)) & ((1 << (MOSParser.NOT_LABEL - 15)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 15)) | (1 << (MOSParser.OPEN_BRACE - 15)) | (1 << (MOSParser.INTEGER_LABEL - 15)) | (1 << (MOSParser.DECIMAL_LABEL - 15)) | (1 << (MOSParser.FLOAT_LABEL - 15)) | (1 << (MOSParser.STRING_LABEL - 15)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 247;
					this.dataPrimary();
					}
				}

				}
				break;

			case 13:
				this.enterOuterAlt(_localctx, 13);
				{
				this.state = 250;
				this.dataPropertyExpression();
				this.state = 251;
				this.match(MOSParser.EXACTLY_LABEL);
				this.state = 252;
				this.nonNegativeInteger();
				this.state = 254;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 15)) & ~0x1F) === 0 && ((1 << (_la - 15)) & ((1 << (MOSParser.NOT_LABEL - 15)) | (1 << (MOSParser.OPEN_CURLY_BRACE - 15)) | (1 << (MOSParser.OPEN_BRACE - 15)) | (1 << (MOSParser.INTEGER_LABEL - 15)) | (1 << (MOSParser.DECIMAL_LABEL - 15)) | (1 << (MOSParser.FLOAT_LABEL - 15)) | (1 << (MOSParser.STRING_LABEL - 15)))) !== 0) || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 253;
					this.dataPrimary();
					}
				}

				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public atomic(): AtomicContext {
		let _localctx: AtomicContext = new AtomicContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, MOSParser.RULE_atomic);
		try {
			this.state = 267;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.FULL_IRI:
			case MOSParser.ABBREVIATED_IRI:
			case MOSParser.SIMPLE_IRI:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 258;
				this.classIRI();
				}
				break;
			case MOSParser.OPEN_CURLY_BRACE:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 259;
				this.match(MOSParser.OPEN_CURLY_BRACE);
				this.state = 260;
				this.individualList();
				this.state = 261;
				this.match(MOSParser.CLOSE_CURLY_BRACE);
				}
				break;
			case MOSParser.OPEN_BRACE:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 263;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 264;
				this.description();
				this.state = 265;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public classIRI(): ClassIRIContext {
		let _localctx: ClassIRIContext = new ClassIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, MOSParser.RULE_classIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 269;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individualList(): IndividualListContext {
		let _localctx: IndividualListContext = new IndividualListContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, MOSParser.RULE_individualList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 271;
			this.individual();
			this.state = 276;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 272;
				this.match(MOSParser.COMMA);
				this.state = 273;
				this.individual();
				}
				}
				this.state = 278;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individual(): IndividualContext {
		let _localctx: IndividualContext = new IndividualContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, MOSParser.RULE_individual);
		try {
			this.state = 281;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.FULL_IRI:
			case MOSParser.ABBREVIATED_IRI:
			case MOSParser.SIMPLE_IRI:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 279;
				this.individualIRI();
				}
				break;
			case MOSParser.NODE_ID:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 280;
				this.match(MOSParser.NODE_ID);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public nonNegativeInteger(): NonNegativeIntegerContext {
		let _localctx: NonNegativeIntegerContext = new NonNegativeIntegerContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, MOSParser.RULE_nonNegativeInteger);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 283;
			this.match(MOSParser.DIGITS);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPrimary(): DataPrimaryContext {
		let _localctx: DataPrimaryContext = new DataPrimaryContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, MOSParser.RULE_dataPrimary);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 286;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.NOT_LABEL) {
				{
				this.state = 285;
				this.match(MOSParser.NOT_LABEL);
				}
			}

			this.state = 288;
			this.dataAtomic();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataAtomic(): DataAtomicContext {
		let _localctx: DataAtomicContext = new DataAtomicContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, MOSParser.RULE_dataAtomic);
		try {
			this.state = 300;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 18, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 290;
				this.dataType();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 291;
				this.match(MOSParser.OPEN_CURLY_BRACE);
				this.state = 292;
				this.literalList();
				this.state = 293;
				this.match(MOSParser.CLOSE_CURLY_BRACE);
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 295;
				this.dataTypeRestriction();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 296;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 297;
				this.dataRange();
				this.state = 298;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public literalList(): LiteralListContext {
		let _localctx: LiteralListContext = new LiteralListContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, MOSParser.RULE_literalList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 302;
			this.literal();
			this.state = 307;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 303;
				this.match(MOSParser.COMMA);
				this.state = 304;
				this.literal();
				}
				}
				this.state = 309;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataType(): DataTypeContext {
		let _localctx: DataTypeContext = new DataTypeContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, MOSParser.RULE_dataType);
		try {
			this.state = 315;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.FULL_IRI:
			case MOSParser.ABBREVIATED_IRI:
			case MOSParser.SIMPLE_IRI:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 310;
				this.datatypeIRI();
				}
				break;
			case MOSParser.INTEGER_LABEL:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 311;
				this.match(MOSParser.INTEGER_LABEL);
				}
				break;
			case MOSParser.DECIMAL_LABEL:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 312;
				this.match(MOSParser.DECIMAL_LABEL);
				}
				break;
			case MOSParser.FLOAT_LABEL:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 313;
				this.match(MOSParser.FLOAT_LABEL);
				}
				break;
			case MOSParser.STRING_LABEL:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 314;
				this.match(MOSParser.STRING_LABEL);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public literal(): LiteralContext {
		let _localctx: LiteralContext = new LiteralContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, MOSParser.RULE_literal);
		try {
			this.state = 323;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 21, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 317;
				this.typedLiteral();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 318;
				this.stringLiteralNoLanguage();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 319;
				this.stringLiteralWithLanguage();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 320;
				this.integerLiteral();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 321;
				this.decimalLiteral();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 322;
				this.floatingPointLiteral();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public typedLiteral(): TypedLiteralContext {
		let _localctx: TypedLiteralContext = new TypedLiteralContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, MOSParser.RULE_typedLiteral);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 325;
			this.lexicalValue();
			this.state = 326;
			this.match(MOSParser.REFERENCE);
			this.state = 327;
			this.dataType();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public stringLiteralNoLanguage(): StringLiteralNoLanguageContext {
		let _localctx: StringLiteralNoLanguageContext = new StringLiteralNoLanguageContext(this._ctx, this.state);
		this.enterRule(_localctx, 34, MOSParser.RULE_stringLiteralNoLanguage);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 329;
			this.match(MOSParser.QUOTED_STRING);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public stringLiteralWithLanguage(): StringLiteralWithLanguageContext {
		let _localctx: StringLiteralWithLanguageContext = new StringLiteralWithLanguageContext(this._ctx, this.state);
		this.enterRule(_localctx, 36, MOSParser.RULE_stringLiteralWithLanguage);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 331;
			this.match(MOSParser.QUOTED_STRING);
			this.state = 332;
			this.match(MOSParser.LANGUAGE_TAG);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public lexicalValue(): LexicalValueContext {
		let _localctx: LexicalValueContext = new LexicalValueContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, MOSParser.RULE_lexicalValue);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 334;
			this.match(MOSParser.QUOTED_STRING);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyExpression(): DataPropertyExpressionContext {
		let _localctx: DataPropertyExpressionContext = new DataPropertyExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, MOSParser.RULE_dataPropertyExpression);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 336;
			this.dataPropertyIRI();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataTypeRestriction(): DataTypeRestrictionContext {
		let _localctx: DataTypeRestrictionContext = new DataTypeRestrictionContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, MOSParser.RULE_dataTypeRestriction);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 338;
			this.dataType();
			this.state = 339;
			this.match(MOSParser.OPEN_SQUARE_BRACE);
			this.state = 340;
			this.facet();
			this.state = 341;
			this.restrictionValue();
			this.state = 348;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 342;
				this.match(MOSParser.COMMA);
				this.state = 343;
				this.facet();
				this.state = 344;
				this.restrictionValue();
				}
				}
				this.state = 350;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 351;
			this.match(MOSParser.CLOSE_SQUARE_BRACE);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public facet(): FacetContext {
		let _localctx: FacetContext = new FacetContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, MOSParser.RULE_facet);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 353;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << MOSParser.LENGTH_LABEL) | (1 << MOSParser.MIN_LENGTH_LABEL) | (1 << MOSParser.MAX_LENGTH_LABEL) | (1 << MOSParser.PATTERN_LABEL) | (1 << MOSParser.LANG_PATTERN_LABEL) | (1 << MOSParser.LESS_EQUAL) | (1 << MOSParser.GREATER_EQUAL) | (1 << MOSParser.LESS) | (1 << MOSParser.GREATER))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public restrictionValue(): RestrictionValueContext {
		let _localctx: RestrictionValueContext = new RestrictionValueContext(this._ctx, this.state);
		this.enterRule(_localctx, 46, MOSParser.RULE_restrictionValue);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 355;
			this.literal();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public inverseObjectProperty(): InverseObjectPropertyContext {
		let _localctx: InverseObjectPropertyContext = new InverseObjectPropertyContext(this._ctx, this.state);
		this.enterRule(_localctx, 48, MOSParser.RULE_inverseObjectProperty);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 357;
			this.match(MOSParser.INVERSE_LABEL);
			this.state = 358;
			this.objectPropertyIRI();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public decimalLiteral(): DecimalLiteralContext {
		let _localctx: DecimalLiteralContext = new DecimalLiteralContext(this._ctx, this.state);
		this.enterRule(_localctx, 50, MOSParser.RULE_decimalLiteral);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 361;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.MINUS || _la === MOSParser.PLUS) {
				{
				this.state = 360;
				_la = this._input.LA(1);
				if (!(_la === MOSParser.MINUS || _la === MOSParser.PLUS)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 363;
			this.match(MOSParser.DIGITS);
			this.state = 364;
			this.match(MOSParser.DOT);
			this.state = 365;
			this.match(MOSParser.DIGITS);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public integerLiteral(): IntegerLiteralContext {
		let _localctx: IntegerLiteralContext = new IntegerLiteralContext(this._ctx, this.state);
		this.enterRule(_localctx, 52, MOSParser.RULE_integerLiteral);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 368;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.MINUS || _la === MOSParser.PLUS) {
				{
				this.state = 367;
				_la = this._input.LA(1);
				if (!(_la === MOSParser.MINUS || _la === MOSParser.PLUS)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 370;
			this.match(MOSParser.DIGITS);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public floatingPointLiteral(): FloatingPointLiteralContext {
		let _localctx: FloatingPointLiteralContext = new FloatingPointLiteralContext(this._ctx, this.state);
		this.enterRule(_localctx, 54, MOSParser.RULE_floatingPointLiteral);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 373;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.MINUS || _la === MOSParser.PLUS) {
				{
				this.state = 372;
				_la = this._input.LA(1);
				if (!(_la === MOSParser.MINUS || _la === MOSParser.PLUS)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 388;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.DIGITS:
				{
				{
				this.state = 375;
				this.match(MOSParser.DIGITS);
				this.state = 378;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === MOSParser.DOT) {
					{
					this.state = 376;
					this.match(MOSParser.DOT);
					this.state = 377;
					this.match(MOSParser.DIGITS);
					}
				}

				this.state = 381;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === MOSParser.EXPONENT) {
					{
					this.state = 380;
					this.match(MOSParser.EXPONENT);
					}
				}

				}
				}
				break;
			case MOSParser.DOT:
				{
				this.state = 383;
				this.match(MOSParser.DOT);
				this.state = 384;
				this.match(MOSParser.DIGITS);
				this.state = 386;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === MOSParser.EXPONENT) {
					{
					this.state = 385;
					this.match(MOSParser.EXPONENT);
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this.state = 390;
			_la = this._input.LA(1);
			if (!(_la === MOSParser.LOWER_FLOAT_SUFFIX || _la === MOSParser.UPPER_FLOAT_SUFFIX)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataRange(): DataRangeContext {
		let _localctx: DataRangeContext = new DataRangeContext(this._ctx, this.state);
		this.enterRule(_localctx, 56, MOSParser.RULE_dataRange);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 392;
			this.dataConjunction();
			this.state = 397;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.OR_LABEL) {
				{
				{
				this.state = 393;
				this.match(MOSParser.OR_LABEL);
				this.state = 394;
				this.dataConjunction();
				}
				}
				this.state = 399;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataConjunction(): DataConjunctionContext {
		let _localctx: DataConjunctionContext = new DataConjunctionContext(this._ctx, this.state);
		this.enterRule(_localctx, 58, MOSParser.RULE_dataConjunction);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 400;
			this.dataPrimary();
			this.state = 405;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.AND_LABEL) {
				{
				{
				this.state = 401;
				this.match(MOSParser.AND_LABEL);
				this.state = 402;
				this.dataPrimary();
				}
				}
				this.state = 407;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotationAnnotatedList(): AnnotationAnnotatedListContext {
		let _localctx: AnnotationAnnotatedListContext = new AnnotationAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 60, MOSParser.RULE_annotationAnnotatedList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 409;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 408;
				this.annotations();
				}
			}

			this.state = 411;
			this.annotation();
			this.state = 419;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 412;
				this.match(MOSParser.COMMA);
				this.state = 414;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === MOSParser.ANNOTATIONS_LABEL) {
					{
					this.state = 413;
					this.annotations();
					}
				}

				this.state = 416;
				this.annotation();
				}
				}
				this.state = 421;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotation(): AnnotationContext {
		let _localctx: AnnotationContext = new AnnotationContext(this._ctx, this.state);
		this.enterRule(_localctx, 62, MOSParser.RULE_annotation);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 422;
			this.annotationPropertyIRI();
			this.state = 423;
			this.annotationTarget();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotationTarget(): AnnotationTargetContext {
		let _localctx: AnnotationTargetContext = new AnnotationTargetContext(this._ctx, this.state);
		this.enterRule(_localctx, 64, MOSParser.RULE_annotationTarget);
		try {
			this.state = 428;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.NODE_ID:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 425;
				this.match(MOSParser.NODE_ID);
				}
				break;
			case MOSParser.FULL_IRI:
			case MOSParser.ABBREVIATED_IRI:
			case MOSParser.SIMPLE_IRI:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 426;
				this.iri();
				}
				break;
			case MOSParser.MINUS:
			case MOSParser.DOT:
			case MOSParser.PLUS:
			case MOSParser.DIGITS:
			case MOSParser.QUOTED_STRING:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 427;
				this.literal();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotations(): AnnotationsContext {
		let _localctx: AnnotationsContext = new AnnotationsContext(this._ctx, this.state);
		this.enterRule(_localctx, 66, MOSParser.RULE_annotations);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 430;
			this.match(MOSParser.ANNOTATIONS_LABEL);
			this.state = 431;
			this.annotationAnnotatedList();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext {
		let _localctx: DescriptionAnnotatedListContext = new DescriptionAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 68, MOSParser.RULE_descriptionAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 434;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 433;
				this.annotations();
				}
			}

			this.state = 436;
			this.description();
			this.state = 441;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 37, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 437;
					this.match(MOSParser.COMMA);
					this.state = 438;
					this.descriptionAnnotatedList();
					}
					}
				}
				this.state = 443;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 37, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public description2List(): Description2ListContext {
		let _localctx: Description2ListContext = new Description2ListContext(this._ctx, this.state);
		this.enterRule(_localctx, 70, MOSParser.RULE_description2List);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 444;
			this.description();
			this.state = 445;
			this.match(MOSParser.COMMA);
			this.state = 446;
			this.descriptionList();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public descriptionList(): DescriptionListContext {
		let _localctx: DescriptionListContext = new DescriptionListContext(this._ctx, this.state);
		this.enterRule(_localctx, 72, MOSParser.RULE_descriptionList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 448;
			this.description();
			this.state = 453;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 449;
				this.match(MOSParser.COMMA);
				this.state = 450;
				this.description();
				}
				}
				this.state = 455;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public classFrame(): ClassFrameContext {
		let _localctx: ClassFrameContext = new ClassFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 74, MOSParser.RULE_classFrame);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 456;
			this.match(MOSParser.CLASS_LABEL);
			this.state = 457;
			this.classIRI();
			this.state = 472;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 62)) & ~0x1F) === 0 && ((1 << (_la - 62)) & ((1 << (MOSParser.EQUIVALENT_TO_LABEL - 62)) | (1 << (MOSParser.SUBCLASS_OF_LABEL - 62)) | (1 << (MOSParser.DISJOINT_WITH_LABEL - 62)) | (1 << (MOSParser.DISJOINT_UNION_OF_LABEL - 62)) | (1 << (MOSParser.ANNOTATIONS_LABEL - 62)))) !== 0)) {
				{
				this.state = 470;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case MOSParser.ANNOTATIONS_LABEL:
					{
					this.state = 458;
					this.match(MOSParser.ANNOTATIONS_LABEL);
					this.state = 459;
					this.annotationAnnotatedList();
					}
					break;
				case MOSParser.SUBCLASS_OF_LABEL:
					{
					this.state = 460;
					this.match(MOSParser.SUBCLASS_OF_LABEL);
					this.state = 461;
					this.descriptionAnnotatedList();
					}
					break;
				case MOSParser.EQUIVALENT_TO_LABEL:
					{
					this.state = 462;
					this.match(MOSParser.EQUIVALENT_TO_LABEL);
					this.state = 463;
					this.descriptionAnnotatedList();
					}
					break;
				case MOSParser.DISJOINT_WITH_LABEL:
					{
					this.state = 464;
					this.match(MOSParser.DISJOINT_WITH_LABEL);
					this.state = 465;
					this.descriptionAnnotatedList();
					}
					break;
				case MOSParser.DISJOINT_UNION_OF_LABEL:
					{
					this.state = 466;
					this.match(MOSParser.DISJOINT_UNION_OF_LABEL);
					this.state = 467;
					this.annotations();
					this.state = 468;
					this.description2List();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 474;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 485;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.HAS_KEY_LABEL) {
				{
				this.state = 475;
				this.match(MOSParser.HAS_KEY_LABEL);
				this.state = 477;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === MOSParser.ANNOTATIONS_LABEL) {
					{
					this.state = 476;
					this.annotations();
					}
				}

				this.state = 481;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				do {
					{
					this.state = 481;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 42, this._ctx) ) {
					case 1:
						{
						this.state = 479;
						this.objectPropertyExpression();
						}
						break;

					case 2:
						{
						this.state = 480;
						this.dataPropertyExpression();
						}
						break;
					}
					}
					this.state = 483;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				} while (_la === MOSParser.INVERSE_LABEL || ((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0));
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyFrame(): ObjectPropertyFrameContext {
		let _localctx: ObjectPropertyFrameContext = new ObjectPropertyFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 76, MOSParser.RULE_objectPropertyFrame);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 487;
			this.match(MOSParser.OBJECT_PROPERTY_LABEL);
			this.state = 488;
			this.objectPropertyIRI();
			this.state = 514;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 47, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					this.state = 512;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case MOSParser.ANNOTATIONS_LABEL:
						{
						this.state = 489;
						this.match(MOSParser.ANNOTATIONS_LABEL);
						this.state = 490;
						this.annotationAnnotatedList();
						}
						break;
					case MOSParser.RANGE_LABEL:
						{
						this.state = 491;
						this.match(MOSParser.RANGE_LABEL);
						this.state = 492;
						this.descriptionAnnotatedList();
						}
						break;
					case MOSParser.CHARACTERISTICS_LABEL:
						{
						this.state = 493;
						this.match(MOSParser.CHARACTERISTICS_LABEL);
						this.state = 494;
						this.objectPropertyCharacteristicAnnotatedList();
						}
						break;
					case MOSParser.SUB_PROPERTY_OF_LABEL:
						{
						this.state = 495;
						this.match(MOSParser.SUB_PROPERTY_OF_LABEL);
						this.state = 496;
						this.objectPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.EQUIVALENT_TO_LABEL:
						{
						this.state = 497;
						this.match(MOSParser.EQUIVALENT_TO_LABEL);
						this.state = 498;
						this.objectPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.DISJOINT_WITH_LABEL:
						{
						this.state = 499;
						this.match(MOSParser.DISJOINT_WITH_LABEL);
						this.state = 500;
						this.objectPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.INVERSE_OF_LABEL:
						{
						this.state = 501;
						this.match(MOSParser.INVERSE_OF_LABEL);
						this.state = 502;
						this.objectPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.SUB_PROPERTY_CHAIN_LABEL:
						{
						this.state = 503;
						this.match(MOSParser.SUB_PROPERTY_CHAIN_LABEL);
						this.state = 504;
						this.annotations();
						this.state = 505;
						this.objectPropertyExpression();
						this.state = 508;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						do {
							{
							{
							this.state = 506;
							this.match(MOSParser.O_LABEL);
							this.state = 507;
							this.objectPropertyExpression();
							}
							}
							this.state = 510;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						} while (_la === MOSParser.O_LABEL);
						}
						break;
					default:
						throw new NoViableAltException(this);
					}
					}
				}
				this.state = 516;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 47, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyCharacteristicAnnotatedList(): ObjectPropertyCharacteristicAnnotatedListContext {
		let _localctx: ObjectPropertyCharacteristicAnnotatedListContext = new ObjectPropertyCharacteristicAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 78, MOSParser.RULE_objectPropertyCharacteristicAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 518;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 517;
				this.annotations();
				}
			}

			this.state = 520;
			this.match(MOSParser.OBJECT_PROPERTY_CHARACTERISTIC);
			this.state = 525;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 49, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 521;
					this.match(MOSParser.COMMA);
					this.state = 522;
					this.objectPropertyCharacteristicAnnotatedList();
					}
					}
				}
				this.state = 527;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 49, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyExpressionAnnotatedList(): ObjectPropertyExpressionAnnotatedListContext {
		let _localctx: ObjectPropertyExpressionAnnotatedListContext = new ObjectPropertyExpressionAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 80, MOSParser.RULE_objectPropertyExpressionAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 529;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 528;
				this.annotations();
				}
			}

			this.state = 531;
			this.objectPropertyExpression();
			this.state = 536;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 51, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 532;
					this.match(MOSParser.COMMA);
					this.state = 533;
					this.objectPropertyExpressionAnnotatedList();
					}
					}
				}
				this.state = 538;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 51, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyFrame(): DataPropertyFrameContext {
		let _localctx: DataPropertyFrameContext = new DataPropertyFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 82, MOSParser.RULE_dataPropertyFrame);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 539;
			this.match(MOSParser.DATA_PROPERTY_LABEL);
			this.state = 540;
			this.dataPropertyIRI();
			this.state = 559;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 53, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					this.state = 557;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case MOSParser.ANNOTATIONS_LABEL:
						{
						this.state = 541;
						this.match(MOSParser.ANNOTATIONS_LABEL);
						this.state = 542;
						this.annotationAnnotatedList();
						}
						break;
					case MOSParser.DOMAIN_LABEL:
						{
						this.state = 543;
						this.match(MOSParser.DOMAIN_LABEL);
						this.state = 544;
						this.descriptionAnnotatedList();
						}
						break;
					case MOSParser.RANGE_LABEL:
						{
						this.state = 545;
						this.match(MOSParser.RANGE_LABEL);
						this.state = 546;
						this.dataRangeAnnotatedList();
						}
						break;
					case MOSParser.CHARACTERISTICS_LABEL:
						{
						this.state = 547;
						this.match(MOSParser.CHARACTERISTICS_LABEL);
						this.state = 548;
						this.annotations();
						this.state = 549;
						this.match(MOSParser.FUNCTIONAL_LABEL);
						}
						break;
					case MOSParser.SUB_PROPERTY_OF_LABEL:
						{
						this.state = 551;
						this.match(MOSParser.SUB_PROPERTY_OF_LABEL);
						this.state = 552;
						this.dataPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.EQUIVALENT_TO_LABEL:
						{
						this.state = 553;
						this.match(MOSParser.EQUIVALENT_TO_LABEL);
						this.state = 554;
						this.dataPropertyExpressionAnnotatedList();
						}
						break;
					case MOSParser.DISJOINT_WITH_LABEL:
						{
						this.state = 555;
						this.match(MOSParser.DISJOINT_WITH_LABEL);
						this.state = 556;
						this.dataPropertyExpressionAnnotatedList();
						}
						break;
					default:
						throw new NoViableAltException(this);
					}
					}
				}
				this.state = 561;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 53, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataRangeAnnotatedList(): DataRangeAnnotatedListContext {
		let _localctx: DataRangeAnnotatedListContext = new DataRangeAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 84, MOSParser.RULE_dataRangeAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 563;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 562;
				this.annotations();
				}
			}

			this.state = 565;
			this.dataRange();
			this.state = 570;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 55, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 566;
					this.match(MOSParser.COMMA);
					this.state = 567;
					this.dataRangeAnnotatedList();
					}
					}
				}
				this.state = 572;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 55, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyExpressionAnnotatedList(): DataPropertyExpressionAnnotatedListContext {
		let _localctx: DataPropertyExpressionAnnotatedListContext = new DataPropertyExpressionAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 86, MOSParser.RULE_dataPropertyExpressionAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 574;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 573;
				this.annotations();
				}
			}

			this.state = 576;
			this.dataPropertyExpression();
			this.state = 581;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 57, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 577;
					this.match(MOSParser.COMMA);
					this.state = 578;
					this.dataPropertyExpressionAnnotatedList();
					}
					}
				}
				this.state = 583;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 57, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotationPropertyFrame(): AnnotationPropertyFrameContext {
		let _localctx: AnnotationPropertyFrameContext = new AnnotationPropertyFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 88, MOSParser.RULE_annotationPropertyFrame);
		let _la: number;
		try {
			this.state = 599;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.ANNOTATION_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 584;
				this.match(MOSParser.ANNOTATION_PROPERTY_LABEL);
				this.state = 585;
				this.annotationPropertyIRI();
				this.state = 590;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === MOSParser.ANNOTATIONS_LABEL) {
					{
					{
					this.state = 586;
					this.match(MOSParser.ANNOTATIONS_LABEL);
					this.state = 587;
					this.annotationAnnotatedList();
					}
					}
					this.state = 592;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
				break;
			case MOSParser.DOMAIN_LABEL:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 593;
				this.match(MOSParser.DOMAIN_LABEL);
				this.state = 594;
				this.iriAnnotatedList();
				}
				break;
			case MOSParser.RANGE_LABEL:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 595;
				this.match(MOSParser.RANGE_LABEL);
				this.state = 596;
				this.iriAnnotatedList();
				}
				break;
			case MOSParser.SUB_PROPERTY_OF_LABEL:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 597;
				this.match(MOSParser.SUB_PROPERTY_OF_LABEL);
				this.state = 598;
				this.annotationPropertyIRIAnnotatedList();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public iriAnnotatedList(): IriAnnotatedListContext {
		let _localctx: IriAnnotatedListContext = new IriAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 90, MOSParser.RULE_iriAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 602;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 601;
				this.annotations();
				}
			}

			this.state = 604;
			this.iri();
			this.state = 609;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 61, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 605;
					this.match(MOSParser.COMMA);
					this.state = 606;
					this.iriAnnotatedList();
					}
					}
				}
				this.state = 611;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 61, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotationPropertyIRI(): AnnotationPropertyIRIContext {
		let _localctx: AnnotationPropertyIRIContext = new AnnotationPropertyIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 92, MOSParser.RULE_annotationPropertyIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 612;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public annotationPropertyIRIAnnotatedList(): AnnotationPropertyIRIAnnotatedListContext {
		let _localctx: AnnotationPropertyIRIAnnotatedListContext = new AnnotationPropertyIRIAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 94, MOSParser.RULE_annotationPropertyIRIAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 615;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 614;
				this.annotations();
				}
			}

			this.state = 617;
			this.annotationPropertyIRI();
			this.state = 622;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 63, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 618;
					this.match(MOSParser.COMMA);
					this.state = 619;
					this.annotationPropertyIRIAnnotatedList();
					}
					}
				}
				this.state = 624;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 63, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individualFrame(): IndividualFrameContext {
		let _localctx: IndividualFrameContext = new IndividualFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 96, MOSParser.RULE_individualFrame);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 625;
			this.match(MOSParser.INDIVIDUAL_LABEL);
			this.state = 626;
			this.individual();
			this.state = 639;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 51)) & ~0x1F) === 0 && ((1 << (_la - 51)) & ((1 << (MOSParser.TYPES_LABEL - 51)) | (1 << (MOSParser.FACTS_LABEL - 51)) | (1 << (MOSParser.SAME_AS_LABEL - 51)) | (1 << (MOSParser.DIFFERENET_FROM_LABEL - 51)) | (1 << (MOSParser.ANNOTATIONS_LABEL - 51)))) !== 0)) {
				{
				this.state = 637;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case MOSParser.ANNOTATIONS_LABEL:
					{
					this.state = 627;
					this.match(MOSParser.ANNOTATIONS_LABEL);
					this.state = 628;
					this.annotationAnnotatedList();
					}
					break;
				case MOSParser.TYPES_LABEL:
					{
					this.state = 629;
					this.match(MOSParser.TYPES_LABEL);
					this.state = 630;
					this.descriptionAnnotatedList();
					}
					break;
				case MOSParser.FACTS_LABEL:
					{
					this.state = 631;
					this.match(MOSParser.FACTS_LABEL);
					this.state = 632;
					this.factAnnotatedList();
					}
					break;
				case MOSParser.SAME_AS_LABEL:
					{
					this.state = 633;
					this.match(MOSParser.SAME_AS_LABEL);
					this.state = 634;
					this.individualAnnotatedList();
					}
					break;
				case MOSParser.DIFFERENET_FROM_LABEL:
					{
					this.state = 635;
					this.match(MOSParser.DIFFERENET_FROM_LABEL);
					this.state = 636;
					this.individualAnnotatedList();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 641;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public factAnnotatedList(): FactAnnotatedListContext {
		let _localctx: FactAnnotatedListContext = new FactAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 98, MOSParser.RULE_factAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 643;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 642;
				this.annotations();
				}
			}

			this.state = 645;
			this.fact();
			this.state = 650;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 67, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 646;
					this.match(MOSParser.COMMA);
					this.state = 647;
					this.factAnnotatedList();
					}
					}
				}
				this.state = 652;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 67, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individualAnnotatedList(): IndividualAnnotatedListContext {
		let _localctx: IndividualAnnotatedListContext = new IndividualAnnotatedListContext(this._ctx, this.state);
		this.enterRule(_localctx, 100, MOSParser.RULE_individualAnnotatedList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 654;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				this.state = 653;
				this.annotations();
				}
			}

			this.state = 656;
			this.individual();
			this.state = 661;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 69, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 657;
					this.match(MOSParser.COMMA);
					this.state = 658;
					this.individualAnnotatedList();
					}
					}
				}
				this.state = 663;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 69, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public fact(): FactContext {
		let _localctx: FactContext = new FactContext(this._ctx, this.state);
		this.enterRule(_localctx, 102, MOSParser.RULE_fact);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 665;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.NOT_LABEL) {
				{
				this.state = 664;
				this.match(MOSParser.NOT_LABEL);
				}
			}

			this.state = 669;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 71, this._ctx) ) {
			case 1:
				{
				this.state = 667;
				this.objectPropertyFact();
				}
				break;

			case 2:
				{
				this.state = 668;
				this.dataPropertyFact();
				}
				break;
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyFact(): ObjectPropertyFactContext {
		let _localctx: ObjectPropertyFactContext = new ObjectPropertyFactContext(this._ctx, this.state);
		this.enterRule(_localctx, 104, MOSParser.RULE_objectPropertyFact);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 671;
			this.objectPropertyIRI();
			this.state = 672;
			this.individual();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyFact(): DataPropertyFactContext {
		let _localctx: DataPropertyFactContext = new DataPropertyFactContext(this._ctx, this.state);
		this.enterRule(_localctx, 106, MOSParser.RULE_dataPropertyFact);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 674;
			this.dataPropertyIRI();
			this.state = 675;
			this.literal();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public datatypeFrame(): DatatypeFrameContext {
		let _localctx: DatatypeFrameContext = new DatatypeFrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 108, MOSParser.RULE_datatypeFrame);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 677;
			this.match(MOSParser.DATATYPE_LABEL);
			this.state = 678;
			this.dataType();
			this.state = 683;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 72, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 679;
					this.match(MOSParser.ANNOTATIONS_LABEL);
					this.state = 680;
					this.annotationAnnotatedList();
					}
					}
				}
				this.state = 685;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 72, this._ctx);
			}
			this.state = 690;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === MOSParser.EQUIVALENT_TO_LABEL) {
				{
				this.state = 686;
				this.match(MOSParser.EQUIVALENT_TO_LABEL);
				this.state = 687;
				this.annotations();
				this.state = 688;
				this.dataRange();
				}
			}

			this.state = 696;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				{
				this.state = 692;
				this.match(MOSParser.ANNOTATIONS_LABEL);
				this.state = 693;
				this.annotationAnnotatedList();
				}
				}
				this.state = 698;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public misc(): MiscContext {
		let _localctx: MiscContext = new MiscContext(this._ctx, this.state);
		this.enterRule(_localctx, 110, MOSParser.RULE_misc);
		try {
			this.state = 731;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 75, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 699;
				this.match(MOSParser.EQUIVALENT_CLASSES_LABEL);
				this.state = 700;
				this.annotations();
				this.state = 701;
				this.description2List();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 703;
				this.match(MOSParser.DISJOINT_CLASSES_LABEL);
				this.state = 704;
				this.annotations();
				this.state = 705;
				this.description2List();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 707;
				this.match(MOSParser.EQUIVALENT_PROPERTIES_LABEL);
				this.state = 708;
				this.annotations();
				this.state = 709;
				this.objectProperty2List();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 711;
				this.match(MOSParser.DISJOINT_PROPERTIES_LABEL);
				this.state = 712;
				this.annotations();
				this.state = 713;
				this.objectProperty2List();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 715;
				this.match(MOSParser.EQUIVALENT_PROPERTIES_LABEL);
				this.state = 716;
				this.annotations();
				this.state = 717;
				this.dataProperty2List();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 719;
				this.match(MOSParser.DISJOINT_PROPERTIES_LABEL);
				this.state = 720;
				this.annotations();
				this.state = 721;
				this.dataProperty2List();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 723;
				this.match(MOSParser.SAME_INDIVIDUAL_LABEL);
				this.state = 724;
				this.annotations();
				this.state = 725;
				this.individual2List();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 727;
				this.match(MOSParser.DIFFERENT_INDIVIDUALS_LABEL);
				this.state = 728;
				this.annotations();
				this.state = 729;
				this.individual2List();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individual2List(): Individual2ListContext {
		let _localctx: Individual2ListContext = new Individual2ListContext(this._ctx, this.state);
		this.enterRule(_localctx, 112, MOSParser.RULE_individual2List);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 733;
			this.individual();
			this.state = 734;
			this.match(MOSParser.COMMA);
			this.state = 735;
			this.individualList();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataProperty2List(): DataProperty2ListContext {
		let _localctx: DataProperty2ListContext = new DataProperty2ListContext(this._ctx, this.state);
		this.enterRule(_localctx, 114, MOSParser.RULE_dataProperty2List);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 737;
			this.dataProperty();
			this.state = 738;
			this.match(MOSParser.COMMA);
			this.state = 739;
			this.dataPropertyList();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyList(): DataPropertyListContext {
		let _localctx: DataPropertyListContext = new DataPropertyListContext(this._ctx, this.state);
		this.enterRule(_localctx, 116, MOSParser.RULE_dataPropertyList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 741;
			this.dataProperty();
			this.state = 746;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 742;
				this.match(MOSParser.COMMA);
				this.state = 743;
				this.dataProperty();
				}
				}
				this.state = 748;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectProperty2List(): ObjectProperty2ListContext {
		let _localctx: ObjectProperty2ListContext = new ObjectProperty2ListContext(this._ctx, this.state);
		this.enterRule(_localctx, 118, MOSParser.RULE_objectProperty2List);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 749;
			this.objectProperty();
			this.state = 750;
			this.match(MOSParser.COMMA);
			this.state = 751;
			this.objectPropertyList();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyList(): ObjectPropertyListContext {
		let _localctx: ObjectPropertyListContext = new ObjectPropertyListContext(this._ctx, this.state);
		this.enterRule(_localctx, 120, MOSParser.RULE_objectPropertyList);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 753;
			this.objectProperty();
			this.state = 758;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.COMMA) {
				{
				{
				this.state = 754;
				this.match(MOSParser.COMMA);
				this.state = 755;
				this.objectProperty();
				}
				}
				this.state = 760;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectProperty(): ObjectPropertyContext {
		let _localctx: ObjectPropertyContext = new ObjectPropertyContext(this._ctx, this.state);
		this.enterRule(_localctx, 122, MOSParser.RULE_objectProperty);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 761;
			this.objectPropertyIRI();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataProperty(): DataPropertyContext {
		let _localctx: DataPropertyContext = new DataPropertyContext(this._ctx, this.state);
		this.enterRule(_localctx, 124, MOSParser.RULE_dataProperty);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 763;
			this.dataPropertyIRI();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dataPropertyIRI(): DataPropertyIRIContext {
		let _localctx: DataPropertyIRIContext = new DataPropertyIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 126, MOSParser.RULE_dataPropertyIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 765;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public datatypeIRI(): DatatypeIRIContext {
		let _localctx: DatatypeIRIContext = new DatatypeIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 128, MOSParser.RULE_datatypeIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 767;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public objectPropertyIRI(): ObjectPropertyIRIContext {
		let _localctx: ObjectPropertyIRIContext = new ObjectPropertyIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 130, MOSParser.RULE_objectPropertyIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 769;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public frame(): FrameContext {
		let _localctx: FrameContext = new FrameContext(this._ctx, this.state);
		this.enterRule(_localctx, 132, MOSParser.RULE_frame);
		try {
			this.state = 778;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.DATATYPE_LABEL:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 771;
				this.datatypeFrame();
				}
				break;
			case MOSParser.CLASS_LABEL:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 772;
				this.classFrame();
				}
				break;
			case MOSParser.OBJECT_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 773;
				this.objectPropertyFrame();
				}
				break;
			case MOSParser.DATA_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 774;
				this.dataPropertyFrame();
				}
				break;
			case MOSParser.RANGE_LABEL:
			case MOSParser.SUB_PROPERTY_OF_LABEL:
			case MOSParser.ANNOTATION_PROPERTY_LABEL:
			case MOSParser.DOMAIN_LABEL:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 775;
				this.annotationPropertyFrame();
				}
				break;
			case MOSParser.INDIVIDUAL_LABEL:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 776;
				this.individualFrame();
				}
				break;
			case MOSParser.EQUIVALENT_CLASSES_LABEL:
			case MOSParser.DISJOINT_CLASSES_LABEL:
			case MOSParser.EQUIVALENT_PROPERTIES_LABEL:
			case MOSParser.DISJOINT_PROPERTIES_LABEL:
			case MOSParser.SAME_INDIVIDUAL_LABEL:
			case MOSParser.DIFFERENT_INDIVIDUALS_LABEL:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 777;
				this.misc();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public entity(): EntityContext {
		let _localctx: EntityContext = new EntityContext(this._ctx, this.state);
		this.enterRule(_localctx, 134, MOSParser.RULE_entity);
		try {
			this.state = 810;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case MOSParser.DATATYPE_LABEL:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 780;
				this.match(MOSParser.DATATYPE_LABEL);
				this.state = 781;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 782;
				this.dataType();
				this.state = 783;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			case MOSParser.CLASS_LABEL:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 785;
				this.match(MOSParser.CLASS_LABEL);
				this.state = 786;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 787;
				this.classIRI();
				this.state = 788;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			case MOSParser.OBJECT_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 790;
				this.match(MOSParser.OBJECT_PROPERTY_LABEL);
				this.state = 791;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 792;
				this.objectPropertyIRI();
				this.state = 793;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			case MOSParser.DATA_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 795;
				this.match(MOSParser.DATA_PROPERTY_LABEL);
				this.state = 796;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 797;
				this.datatypePropertyIRI();
				this.state = 798;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			case MOSParser.ANNOTATION_PROPERTY_LABEL:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 800;
				this.match(MOSParser.ANNOTATION_PROPERTY_LABEL);
				this.state = 801;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 802;
				this.annotationPropertyIRI();
				this.state = 803;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			case MOSParser.NAMED_INDIVIDUAL_LABEL:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 805;
				this.match(MOSParser.NAMED_INDIVIDUAL_LABEL);
				this.state = 806;
				this.match(MOSParser.OPEN_BRACE);
				this.state = 807;
				this.individualIRI();
				this.state = 808;
				this.match(MOSParser.CLOSE_BRACE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public individualIRI(): IndividualIRIContext {
		let _localctx: IndividualIRIContext = new IndividualIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 136, MOSParser.RULE_individualIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 812;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public datatypePropertyIRI(): DatatypePropertyIRIContext {
		let _localctx: DatatypePropertyIRIContext = new DatatypePropertyIRIContext(this._ctx, this.state);
		this.enterRule(_localctx, 138, MOSParser.RULE_datatypePropertyIRI);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 814;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ontologyDocument(): OntologyDocumentContext {
		let _localctx: OntologyDocumentContext = new OntologyDocumentContext(this._ctx, this.state);
		this.enterRule(_localctx, 140, MOSParser.RULE_ontologyDocument);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 819;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.PREFIX_LABEL) {
				{
				{
				this.state = 816;
				this.prefixDeclaration();
				}
				}
				this.state = 821;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 822;
			this.ontology();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public prefixDeclaration(): PrefixDeclarationContext {
		let _localctx: PrefixDeclarationContext = new PrefixDeclarationContext(this._ctx, this.state);
		this.enterRule(_localctx, 142, MOSParser.RULE_prefixDeclaration);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 824;
			this.match(MOSParser.PREFIX_LABEL);
			this.state = 825;
			this.match(MOSParser.PREFIX_NAME);
			this.state = 826;
			this.match(MOSParser.FULL_IRI);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ontology(): OntologyContext {
		let _localctx: OntologyContext = new OntologyContext(this._ctx, this.state);
		this.enterRule(_localctx, 144, MOSParser.RULE_ontology);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 828;
			this.match(MOSParser.ONTOLOGY_LABEL);
			this.state = 833;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
				{
				this.state = 829;
				this.ontologyIri();
				this.state = 831;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 72)) & ~0x1F) === 0 && ((1 << (_la - 72)) & ((1 << (MOSParser.FULL_IRI - 72)) | (1 << (MOSParser.ABBREVIATED_IRI - 72)) | (1 << (MOSParser.SIMPLE_IRI - 72)))) !== 0)) {
					{
					this.state = 830;
					this.versionIri();
					}
				}

				}
			}

			this.state = 838;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.IMPORT_LABEL) {
				{
				{
				this.state = 835;
				this.imports();
				}
				}
				this.state = 840;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 844;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === MOSParser.ANNOTATIONS_LABEL) {
				{
				{
				this.state = 841;
				this.annotations();
				}
				}
				this.state = 846;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 850;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (((((_la - 40)) & ~0x1F) === 0 && ((1 << (_la - 40)) & ((1 << (MOSParser.RANGE_LABEL - 40)) | (1 << (MOSParser.SUB_PROPERTY_OF_LABEL - 40)) | (1 << (MOSParser.OBJECT_PROPERTY_LABEL - 40)) | (1 << (MOSParser.DATA_PROPERTY_LABEL - 40)) | (1 << (MOSParser.ANNOTATION_PROPERTY_LABEL - 40)) | (1 << (MOSParser.INDIVIDUAL_LABEL - 40)) | (1 << (MOSParser.DATATYPE_LABEL - 40)) | (1 << (MOSParser.EQUIVALENT_CLASSES_LABEL - 40)) | (1 << (MOSParser.DISJOINT_CLASSES_LABEL - 40)) | (1 << (MOSParser.EQUIVALENT_PROPERTIES_LABEL - 40)) | (1 << (MOSParser.DISJOINT_PROPERTIES_LABEL - 40)) | (1 << (MOSParser.SAME_INDIVIDUAL_LABEL - 40)) | (1 << (MOSParser.DIFFERENT_INDIVIDUALS_LABEL - 40)) | (1 << (MOSParser.CLASS_LABEL - 40)))) !== 0) || _la === MOSParser.DOMAIN_LABEL) {
				{
				{
				this.state = 847;
				this.frame();
				}
				}
				this.state = 852;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ontologyIri(): OntologyIriContext {
		let _localctx: OntologyIriContext = new OntologyIriContext(this._ctx, this.state);
		this.enterRule(_localctx, 146, MOSParser.RULE_ontologyIri);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 853;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public versionIri(): VersionIriContext {
		let _localctx: VersionIriContext = new VersionIriContext(this._ctx, this.state);
		this.enterRule(_localctx, 148, MOSParser.RULE_versionIri);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 855;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public imports(): ImportsContext {
		let _localctx: ImportsContext = new ImportsContext(this._ctx, this.state);
		this.enterRule(_localctx, 150, MOSParser.RULE_imports);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 857;
			this.match(MOSParser.IMPORT_LABEL);
			this.state = 858;
			this.iri();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	private static readonly _serializedATNSegments: number = 2;
	private static readonly _serializedATNSegment0: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03U\u035F\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04" +
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#" +
		"\t#\x04$\t$\x04%\t%\x04&\t&\x04\'\t\'\x04(\t(\x04)\t)\x04*\t*\x04+\t+" +
		"\x04,\t,\x04-\t-\x04.\t.\x04/\t/\x040\t0\x041\t1\x042\t2\x043\t3\x044" +
		"\t4\x045\t5\x046\t6\x047\t7\x048\t8\x049\t9\x04:\t:\x04;\t;\x04<\t<\x04" +
		"=\t=\x04>\t>\x04?\t?\x04@\t@\x04A\tA\x04B\tB\x04C\tC\x04D\tD\x04E\tE\x04" +
		"F\tF\x04G\tG\x04H\tH\x04I\tI\x04J\tJ\x04K\tK\x04L\tL\x04M\tM\x03\x02\x03" +
		"\x02\x03\x02\x07\x02\x9E\n\x02\f\x02\x0E\x02\xA1\v\x02\x03\x03\x03\x03" +
		"\x03\x03\x07\x03\xA6\n\x03\f\x03\x0E\x03\xA9\v\x03\x03\x03\x03\x03\x03" +
		"\x03\x03\x03\x03\x03\x07\x03\xB0\n\x03\f\x03\x0E\x03\xB3\v\x03\x05\x03" +
		"\xB5\n\x03\x03\x04\x05\x04\xB8\n\x04\x03\x04\x03\x04\x05\x04\xBC\n\x04" +
		"\x03\x05\x03\x05\x03\x06\x03\x06\x05\x06\xC2\n\x06\x03\x07\x03\x07\x03" +
		"\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03" +
		"\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x05\x07\xD7" +
		"\n\x07\x03\x07\x03\x07\x03\x07\x03\x07\x05\x07\xDD\n\x07\x03\x07\x03\x07" +
		"\x03\x07\x03\x07\x05\x07\xE3\n\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03" +
		"\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03" +
		"\x07\x03\x07\x03\x07\x05\x07\xF5\n\x07\x03\x07\x03\x07\x03\x07\x03\x07" +
		"\x05\x07\xFB\n\x07\x03\x07\x03\x07\x03\x07\x03\x07\x05\x07\u0101\n\x07" +
		"\x05\x07\u0103\n\x07\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03\b\x03" +
		"\b\x05\b\u010E\n\b\x03\t\x03\t\x03\n\x03\n\x03\n\x07\n\u0115\n\n\f\n\x0E" +
		"\n\u0118\v\n\x03\v\x03\v\x05\v\u011C\n\v\x03\f\x03\f\x03\r\x05\r\u0121" +
		"\n\r\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E" +
		"\x03\x0E\x03\x0E\x03\x0E\x05\x0E\u012F\n\x0E\x03\x0F\x03\x0F\x03\x0F\x07" +
		"\x0F\u0134\n\x0F\f\x0F\x0E\x0F\u0137\v\x0F\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x03\x10\x05\x10\u013E\n\x10\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11" +
		"\x03\x11\x05\x11\u0146\n\x11\x03\x12\x03\x12\x03\x12\x03\x12\x03\x13\x03" +
		"\x13\x03\x14\x03\x14\x03\x14\x03\x15\x03\x15\x03\x16\x03\x16\x03\x17\x03" +
		"\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x07\x17\u015D\n\x17" +
		"\f\x17\x0E\x17\u0160\v\x17\x03\x17\x03\x17\x03\x18\x03\x18\x03\x19\x03" +
		"\x19\x03\x1A\x03\x1A\x03\x1A\x03\x1B\x05\x1B\u016C\n\x1B\x03\x1B\x03\x1B" +
		"\x03\x1B\x03\x1B\x03\x1C\x05\x1C\u0173\n\x1C\x03\x1C\x03\x1C\x03\x1D\x05" +
		"\x1D\u0178\n\x1D\x03\x1D\x03\x1D\x03\x1D\x05\x1D\u017D\n\x1D\x03\x1D\x05" +
		"\x1D\u0180\n\x1D\x03\x1D\x03\x1D\x03\x1D\x05\x1D\u0185\n\x1D\x05\x1D\u0187" +
		"\n\x1D\x03\x1D\x03\x1D\x03\x1E\x03\x1E\x03\x1E\x07\x1E\u018E\n\x1E\f\x1E" +
		"\x0E\x1E\u0191\v\x1E\x03\x1F\x03\x1F\x03\x1F\x07\x1F\u0196\n\x1F\f\x1F" +
		"\x0E\x1F\u0199\v\x1F\x03 \x05 \u019C\n \x03 \x03 \x03 \x05 \u01A1\n \x03" +
		" \x07 \u01A4\n \f \x0E \u01A7\v \x03!\x03!\x03!\x03\"\x03\"\x03\"\x05" +
		"\"\u01AF\n\"\x03#\x03#\x03#\x03$\x05$\u01B5\n$\x03$\x03$\x03$\x07$\u01BA" +
		"\n$\f$\x0E$\u01BD\v$\x03%\x03%\x03%\x03%\x03&\x03&\x03&\x07&\u01C6\n&" +
		"\f&\x0E&\u01C9\v&\x03\'\x03\'\x03\'\x03\'\x03\'\x03\'\x03\'\x03\'\x03" +
		"\'\x03\'\x03\'\x03\'\x03\'\x03\'\x07\'\u01D9\n\'\f\'\x0E\'\u01DC\v\'\x03" +
		"\'\x03\'\x05\'\u01E0\n\'\x03\'\x03\'\x06\'\u01E4\n\'\r\'\x0E\'\u01E5\x05" +
		"\'\u01E8\n\'\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03" +
		"(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x06(\u01FF\n(\r(\x0E(\u0200" +
		"\x07(\u0203\n(\f(\x0E(\u0206\v(\x03)\x05)\u0209\n)\x03)\x03)\x03)\x07" +
		")\u020E\n)\f)\x0E)\u0211\v)\x03*\x05*\u0214\n*\x03*\x03*\x03*\x07*\u0219" +
		"\n*\f*\x0E*\u021C\v*\x03+\x03+\x03+\x03+\x03+\x03+\x03+\x03+\x03+\x03" +
		"+\x03+\x03+\x03+\x03+\x03+\x03+\x03+\x03+\x07+\u0230\n+\f+\x0E+\u0233" +
		"\v+\x03,\x05,\u0236\n,\x03,\x03,\x03,\x07,\u023B\n,\f,\x0E,\u023E\v,\x03" +
		"-\x05-\u0241\n-\x03-\x03-\x03-\x07-\u0246\n-\f-\x0E-\u0249\v-\x03.\x03" +
		".\x03.\x03.\x07.\u024F\n.\f.\x0E.\u0252\v.\x03.\x03.\x03.\x03.\x03.\x03" +
		".\x05.\u025A\n.\x03/\x05/\u025D\n/\x03/\x03/\x03/\x07/\u0262\n/\f/\x0E" +
		"/\u0265\v/\x030\x030\x031\x051\u026A\n1\x031\x031\x031\x071\u026F\n1\f" +
		"1\x0E1\u0272\v1\x032\x032\x032\x032\x032\x032\x032\x032\x032\x032\x03" +
		"2\x032\x072\u0280\n2\f2\x0E2\u0283\v2\x033\x053\u0286\n3\x033\x033\x03" +
		"3\x073\u028B\n3\f3\x0E3\u028E\v3\x034\x054\u0291\n4\x034\x034\x034\x07" +
		"4\u0296\n4\f4\x0E4\u0299\v4\x035\x055\u029C\n5\x035\x035\x055\u02A0\n" +
		"5\x036\x036\x036\x037\x037\x037\x038\x038\x038\x038\x078\u02AC\n8\f8\x0E" +
		"8\u02AF\v8\x038\x038\x038\x038\x058\u02B5\n8\x038\x038\x078\u02B9\n8\f" +
		"8\x0E8\u02BC\v8\x039\x039\x039\x039\x039\x039\x039\x039\x039\x039\x03" +
		"9\x039\x039\x039\x039\x039\x039\x039\x039\x039\x039\x039\x039\x039\x03" +
		"9\x039\x039\x039\x039\x039\x039\x039\x059\u02DE\n9\x03:\x03:\x03:\x03" +
		":\x03;\x03;\x03;\x03;\x03<\x03<\x03<\x07<\u02EB\n<\f<\x0E<\u02EE\v<\x03" +
		"=\x03=\x03=\x03=\x03>\x03>\x03>\x07>\u02F7\n>\f>\x0E>\u02FA\v>\x03?\x03" +
		"?\x03@\x03@\x03A\x03A\x03B\x03B\x03C\x03C\x03D\x03D\x03D\x03D\x03D\x03" +
		"D\x03D\x05D\u030D\nD\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03" +
		"E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03E\x03" +
		"E\x03E\x03E\x03E\x03E\x03E\x03E\x05E\u032D\nE\x03F\x03F\x03G\x03G\x03" +
		"H\x07H\u0334\nH\fH\x0EH\u0337\vH\x03H\x03H\x03I\x03I\x03I\x03I\x03J\x03" +
		"J\x03J\x05J\u0342\nJ\x05J\u0344\nJ\x03J\x07J\u0347\nJ\fJ\x0EJ\u034A\v" +
		"J\x03J\x07J\u034D\nJ\fJ\x0EJ\u0350\vJ\x03J\x07J\u0353\nJ\fJ\x0EJ\u0356" +
		"\vJ\x03K\x03K\x03L\x03L\x03M\x03M\x03M\x03M\x02\x02\x02N\x02\x02\x04\x02" +
		"\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18" +
		"\x02\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x02" +
		"0\x022\x024\x026\x028\x02:\x02<\x02>\x02@\x02B\x02D\x02F\x02H\x02J\x02" +
		"L\x02N\x02P\x02R\x02T\x02V\x02X\x02Z\x02\\\x02^\x02`\x02b\x02d\x02f\x02" +
		"h\x02j\x02l\x02n\x02p\x02r\x02t\x02v\x02x\x02z\x02|\x02~\x02\x80\x02\x82" +
		"\x02\x84\x02\x86\x02\x88\x02\x8A\x02\x8C\x02\x8E\x02\x90\x02\x92\x02\x94" +
		"\x02\x96\x02\x98\x02\x02\x06\x04\x02JJRS\x04\x02\x06\n\x13\x16\x04\x02" +
		"\r\r\x0F\x0F\x03\x02\x03\x04\x02\u03A0\x02\x9A\x03\x02\x02\x02\x04\xB4" +
		"\x03\x02\x02\x02\x06\xB7\x03\x02\x02\x02\b\xBD\x03\x02\x02\x02\n\xC1\x03" +
		"\x02\x02\x02\f\u0102\x03\x02\x02\x02\x0E\u010D\x03\x02\x02\x02\x10\u010F" +
		"\x03\x02\x02\x02\x12\u0111\x03\x02\x02\x02\x14\u011B\x03\x02\x02\x02\x16" +
		"\u011D\x03\x02\x02\x02\x18\u0120\x03\x02\x02\x02\x1A\u012E\x03\x02\x02" +
		"\x02\x1C\u0130\x03\x02\x02\x02\x1E\u013D\x03\x02\x02\x02 \u0145\x03\x02" +
		"\x02\x02\"\u0147\x03\x02\x02\x02$\u014B\x03\x02\x02\x02&\u014D\x03\x02" +
		"\x02\x02(\u0150\x03\x02\x02\x02*\u0152\x03\x02\x02\x02,\u0154\x03\x02" +
		"\x02\x02.\u0163\x03\x02\x02\x020\u0165\x03\x02\x02\x022\u0167\x03\x02" +
		"\x02\x024\u016B\x03\x02\x02\x026\u0172\x03\x02\x02\x028\u0177\x03\x02" +
		"\x02\x02:\u018A\x03\x02\x02\x02<\u0192\x03\x02\x02\x02>\u019B\x03\x02" +
		"\x02\x02@\u01A8\x03\x02\x02\x02B\u01AE\x03\x02\x02\x02D\u01B0\x03\x02" +
		"\x02\x02F\u01B4\x03\x02\x02\x02H\u01BE\x03\x02\x02\x02J\u01C2\x03\x02" +
		"\x02\x02L\u01CA\x03\x02\x02\x02N\u01E9\x03\x02\x02\x02P\u0208\x03\x02" +
		"\x02\x02R\u0213\x03\x02\x02\x02T\u021D\x03\x02\x02\x02V\u0235\x03\x02" +
		"\x02\x02X\u0240\x03\x02\x02\x02Z\u0259\x03\x02\x02\x02\\\u025C\x03\x02" +
		"\x02\x02^\u0266\x03\x02\x02\x02`\u0269\x03\x02\x02\x02b\u0273\x03\x02" +
		"\x02\x02d\u0285\x03\x02\x02\x02f\u0290\x03\x02\x02\x02h\u029B\x03\x02" +
		"\x02\x02j\u02A1\x03\x02\x02\x02l\u02A4\x03\x02\x02\x02n\u02A7\x03\x02" +
		"\x02\x02p\u02DD\x03\x02\x02\x02r\u02DF\x03\x02\x02\x02t\u02E3\x03\x02" +
		"\x02\x02v\u02E7\x03\x02\x02\x02x\u02EF\x03\x02\x02\x02z\u02F3\x03\x02" +
		"\x02\x02|\u02FB\x03\x02\x02\x02~\u02FD\x03\x02\x02\x02\x80\u02FF\x03\x02" +
		"\x02\x02\x82\u0301\x03\x02\x02\x02\x84\u0303\x03\x02\x02\x02\x86\u030C" +
		"\x03\x02\x02\x02\x88\u032C\x03\x02\x02\x02\x8A\u032E\x03\x02\x02\x02\x8C" +
		"\u0330\x03\x02\x02\x02\x8E\u0335\x03\x02\x02\x02\x90\u033A\x03\x02\x02" +
		"\x02\x92\u033E\x03\x02\x02\x02\x94\u0357\x03\x02\x02\x02\x96\u0359\x03" +
		"\x02\x02\x02\x98\u035B\x03\x02\x02\x02\x9A\x9F\x05\x04\x03\x02\x9B\x9C" +
		"\x07\x19\x02\x02\x9C\x9E\x05\x04\x03\x02\x9D\x9B\x03\x02\x02\x02\x9E\xA1" +
		"\x03\x02\x02\x02\x9F\x9D\x03\x02\x02\x02\x9F\xA0\x03\x02\x02\x02\xA0\x03" +
		"\x03\x02\x02\x02\xA1\x9F\x03\x02\x02\x02\xA2\xA7\x05\x06\x04\x02\xA3\xA4" +
		"\x07\x1A\x02\x02\xA4\xA6\x05\x06\x04\x02\xA5\xA3\x03\x02\x02\x02\xA6\xA9" +
		"\x03\x02\x02\x02\xA7\xA5\x03\x02\x02\x02\xA7\xA8\x03\x02\x02\x02\xA8\xB5" +
		"\x03\x02\x02\x02\xA9\xA7\x03\x02\x02\x02\xAA\xAB\x05\x10\t\x02\xAB\xAC" +
		"\x07\v\x02\x02\xAC\xB1\x05\x06\x04\x02\xAD\xAE\x07\x1A\x02\x02\xAE\xB0" +
		"\x05\x06\x04\x02\xAF\xAD\x03\x02\x02\x02\xB0\xB3\x03\x02\x02\x02\xB1\xAF" +
		"\x03\x02\x02\x02\xB1\xB2\x03\x02\x02\x02\xB2\xB5\x03\x02\x02\x02\xB3\xB1" +
		"\x03\x02\x02\x02\xB4\xA2\x03\x02\x02\x02\xB4\xAA\x03\x02\x02\x02\xB5\x05" +
		"\x03\x02\x02\x02\xB6\xB8\x07\x11\x02\x02\xB7\xB6\x03\x02\x02\x02\xB7\xB8" +
		"\x03\x02\x02\x02\xB8\xBB\x03\x02\x02\x02\xB9\xBC\x05\f\x07\x02\xBA\xBC" +
		"\x05\x0E\b\x02\xBB\xB9\x03\x02\x02\x02\xBB\xBA\x03\x02\x02\x02\xBC\x07" +
		"\x03\x02\x02\x02\xBD\xBE\t\x02\x02\x02\xBE\t\x03\x02\x02\x02\xBF\xC2\x05" +
		"\x84C\x02\xC0\xC2\x052\x1A\x02\xC1\xBF\x03\x02\x02\x02\xC1\xC0\x03\x02" +
		"\x02\x02\xC2\v\x03\x02\x02\x02\xC3\xC4\x05\n\x06\x02\xC4\xC5\x07\x1B\x02" +
		"\x02\xC5\xC6\x05\x06\x04\x02\xC6\u0103\x03\x02\x02\x02\xC7\xC8\x05\n\x06" +
		"\x02\xC8\xC9\x07\x1C\x02\x02\xC9\xCA\x05\x06\x04\x02\xCA\u0103\x03\x02" +
		"\x02\x02\xCB\xCC\x05\n\x06\x02\xCC\xCD\x07\x1D\x02\x02\xCD\xCE\x05\x14" +
		"\v\x02\xCE\u0103\x03\x02\x02\x02\xCF\xD0\x05\n\x06\x02\xD0\xD1\x07\x1E" +
		"\x02\x02\xD1\u0103\x03\x02\x02\x02\xD2\xD3\x05\n\x06\x02\xD3\xD4\x07\x1F" +
		"\x02\x02\xD4\xD6\x05\x16\f\x02\xD5\xD7\x05\x06\x04\x02\xD6\xD5\x03\x02" +
		"\x02\x02\xD6\xD7\x03\x02\x02\x02\xD7\u0103\x03\x02\x02\x02\xD8\xD9\x05" +
		"\n\x06\x02\xD9\xDA\x07 \x02\x02\xDA\xDC\x05\x16\f\x02\xDB\xDD\x05\x06" +
		"\x04\x02\xDC\xDB\x03\x02\x02\x02\xDC\xDD\x03\x02\x02\x02\xDD\u0103\x03" +
		"\x02\x02\x02\xDE\xDF\x05\n\x06\x02\xDF\xE0\x07!\x02\x02\xE0\xE2\x05\x16" +
		"\f\x02\xE1\xE3\x05\x06\x04\x02\xE2\xE1\x03\x02\x02\x02\xE2\xE3\x03\x02" +
		"\x02\x02\xE3\u0103\x03\x02\x02\x02\xE4\xE5\x05*\x16\x02\xE5\xE6\x07\x1B" +
		"\x02\x02\xE6\xE7\x05\x18\r\x02\xE7\u0103\x03\x02\x02\x02\xE8\xE9\x05*" +
		"\x16\x02\xE9\xEA\x07\x1C\x02\x02\xEA\xEB\x05\x18\r\x02\xEB\u0103\x03\x02" +
		"\x02\x02\xEC\xED\x05*\x16\x02\xED\xEE\x07\x1D\x02\x02\xEE\xEF\x05 \x11" +
		"\x02\xEF\u0103\x03\x02\x02\x02\xF0\xF1\x05*\x16\x02\xF1\xF2\x07\x1F\x02" +
		"\x02\xF2\xF4\x05\x16\f\x02\xF3\xF5\x05\x18\r\x02\xF4\xF3\x03\x02\x02\x02" +
		"\xF4\xF5\x03\x02\x02\x02\xF5\u0103\x03\x02\x02\x02\xF6\xF7\x05*\x16\x02" +
		"\xF7\xF8\x07 \x02\x02\xF8\xFA\x05\x16\f\x02\xF9\xFB\x05\x18\r\x02\xFA" +
		"\xF9\x03\x02\x02\x02\xFA\xFB\x03\x02\x02\x02\xFB\u0103\x03\x02\x02\x02" +
		"\xFC\xFD\x05*\x16\x02\xFD\xFE\x07!\x02\x02\xFE\u0100\x05\x16\f\x02\xFF" +
		"\u0101\x05\x18\r\x02\u0100\xFF\x03\x02\x02\x02\u0100\u0101\x03\x02\x02" +
		"\x02\u0101\u0103\x03\x02\x02\x02\u0102\xC3\x03\x02\x02\x02\u0102\xC7\x03" +
		"\x02\x02\x02\u0102\xCB\x03\x02\x02\x02\u0102\xCF\x03\x02\x02\x02\u0102" +
		"\xD2\x03\x02\x02\x02\u0102\xD8\x03\x02\x02\x02\u0102\xDE\x03\x02\x02\x02" +
		"\u0102\xE4\x03\x02\x02\x02\u0102\xE8\x03\x02\x02\x02\u0102\xEC\x03\x02" +
		"\x02\x02\u0102\xF0\x03\x02\x02\x02\u0102\xF6\x03\x02\x02\x02\u0102\xFC" +
		"\x03\x02\x02\x02\u0103\r\x03\x02\x02\x02\u0104\u010E\x05\x10\t\x02\u0105" +
		"\u0106\x07\x17\x02\x02\u0106\u0107\x05\x12\n\x02\u0107\u0108\x07\x18\x02" +
		"\x02\u0108\u010E\x03\x02\x02\x02\u0109\u010A\x07#\x02\x02\u010A\u010B" +
		"\x05\x02\x02\x02\u010B\u010C\x07$\x02\x02\u010C\u010E\x03\x02\x02\x02" +
		"\u010D\u0104\x03\x02\x02\x02\u010D\u0105\x03\x02\x02\x02\u010D\u0109\x03" +
		"\x02\x02\x02\u010E\x0F\x03\x02\x02\x02\u010F\u0110\x05\b\x05\x02\u0110" +
		"\x11\x03\x02\x02\x02\u0111\u0116\x05\x14\v\x02\u0112\u0113\x07\"\x02\x02" +
		"\u0113\u0115\x05\x14\v\x02\u0114\u0112\x03\x02\x02\x02\u0115\u0118\x03" +
		"\x02\x02\x02\u0116\u0114\x03\x02\x02\x02\u0116\u0117\x03\x02\x02\x02\u0117" +
		"\x13\x03\x02\x02\x02\u0118\u0116\x03\x02\x02\x02\u0119\u011C\x05\x8AF" +
		"\x02\u011A\u011C\x07K\x02\x02\u011B\u0119\x03\x02\x02\x02\u011B\u011A" +
		"\x03\x02\x02\x02\u011C\x15\x03\x02\x02\x02\u011D\u011E\x07\x10\x02\x02" +
		"\u011E\x17\x03\x02\x02\x02\u011F\u0121\x07\x11\x02\x02\u0120\u011F\x03" +
		"\x02\x02\x02\u0120\u0121\x03\x02\x02\x02\u0121\u0122\x03\x02\x02\x02\u0122" +
		"\u0123\x05\x1A\x0E\x02\u0123\x19\x03\x02\x02\x02\u0124\u012F\x05\x1E\x10" +
		"\x02\u0125\u0126\x07\x17\x02\x02\u0126\u0127\x05\x1C\x0F\x02\u0127\u0128" +
		"\x07\x18\x02\x02\u0128\u012F\x03\x02\x02\x02\u0129\u012F\x05,\x17\x02" +
		"\u012A\u012B\x07#\x02\x02\u012B\u012C\x05:\x1E\x02\u012C\u012D\x07$\x02" +
		"\x02\u012D\u012F\x03\x02\x02\x02\u012E\u0124\x03\x02\x02\x02\u012E\u0125" +
		"\x03\x02\x02\x02\u012E\u0129\x03\x02\x02\x02\u012E\u012A\x03\x02\x02\x02" +
		"\u012F\x1B\x03\x02\x02\x02\u0130\u0135\x05 \x11\x02\u0131\u0132\x07\"" +
		"\x02\x02\u0132\u0134\x05 \x11\x02\u0133\u0131\x03\x02\x02\x02\u0134\u0137" +
		"\x03\x02\x02\x02\u0135\u0133\x03\x02\x02\x02\u0135\u0136\x03\x02\x02\x02" +
		"\u0136\x1D\x03\x02\x02\x02\u0137\u0135\x03\x02\x02\x02\u0138\u013E\x05" +
		"\x82B\x02\u0139\u013E\x07%\x02\x02\u013A\u013E\x07&\x02\x02\u013B\u013E" +
		"\x07\'\x02\x02\u013C\u013E\x07(\x02\x02\u013D\u0138\x03\x02\x02\x02\u013D" +
		"\u0139\x03\x02\x02\x02\u013D\u013A\x03\x02\x02\x02\u013D\u013B\x03\x02" +
		"\x02\x02\u013D\u013C\x03\x02\x02\x02\u013E\x1F\x03\x02\x02\x02\u013F\u0146" +
		"\x05\"\x12\x02\u0140\u0146\x05$\x13\x02\u0141\u0146\x05&\x14\x02\u0142" +
		"\u0146\x056\x1C\x02\u0143\u0146\x054\x1B\x02\u0144\u0146\x058\x1D\x02" +
		"\u0145\u013F\x03\x02\x02\x02\u0145\u0140\x03\x02\x02\x02\u0145\u0141\x03" +
		"\x02\x02\x02\u0145\u0142\x03\x02\x02\x02\u0145\u0143\x03\x02\x02\x02\u0145" +
		"\u0144\x03\x02\x02\x02\u0146!\x03\x02\x02\x02\u0147\u0148\x05(\x15\x02" +
		"\u0148\u0149\x07)\x02\x02\u0149\u014A\x05\x1E\x10\x02\u014A#\x03\x02\x02" +
		"\x02\u014B\u014C\x07N\x02\x02\u014C%\x03\x02\x02\x02\u014D\u014E\x07N" +
		"\x02\x02\u014E\u014F\x07O\x02\x02\u014F\'\x03\x02\x02\x02\u0150\u0151" +
		"\x07N\x02\x02\u0151)\x03\x02\x02\x02\u0152\u0153\x05\x80A\x02\u0153+\x03" +
		"\x02\x02\x02\u0154\u0155\x05\x1E\x10\x02\u0155\u0156\x07L\x02\x02\u0156" +
		"\u0157\x05.\x18\x02\u0157\u015E\x050\x19\x02\u0158\u0159\x07\"\x02\x02" +
		"\u0159\u015A\x05.\x18\x02\u015A\u015B\x050\x19\x02\u015B\u015D\x03\x02" +
		"\x02\x02\u015C\u0158\x03\x02\x02\x02\u015D\u0160\x03\x02\x02\x02\u015E" +
		"\u015C\x03\x02\x02\x02\u015E\u015F\x03\x02\x02\x02\u015F\u0161\x03\x02" +
		"\x02\x02\u0160\u015E\x03\x02\x02\x02\u0161\u0162\x07M\x02\x02\u0162-\x03" +
		"\x02\x02\x02\u0163\u0164\t\x03\x02\x02\u0164/\x03\x02\x02\x02\u0165\u0166" +
		"\x05 \x11\x02\u01661\x03\x02\x02\x02\u0167\u0168\x07\f\x02\x02\u0168\u0169" +
		"\x05\x84C\x02\u01693\x03\x02\x02\x02\u016A\u016C\t\x04\x02\x02\u016B\u016A" +
		"\x03\x02\x02\x02\u016B\u016C\x03\x02\x02\x02\u016C\u016D\x03\x02\x02\x02" +
		"\u016D\u016E\x07\x10\x02\x02\u016E\u016F\x07\x0E\x02\x02\u016F\u0170\x07" +
		"\x10\x02\x02\u01705\x03\x02\x02\x02\u0171\u0173\t\x04\x02\x02\u0172\u0171" +
		"\x03\x02\x02\x02\u0172\u0173\x03\x02\x02\x02\u0173\u0174\x03\x02\x02\x02" +
		"\u0174\u0175\x07\x10\x02\x02\u01757\x03\x02\x02\x02\u0176\u0178\t\x04" +
		"\x02\x02\u0177\u0176\x03\x02\x02\x02\u0177\u0178\x03\x02\x02\x02\u0178" +
		"\u0186\x03\x02\x02\x02\u0179\u017C\x07\x10\x02\x02\u017A\u017B\x07\x0E" +
		"\x02\x02\u017B\u017D\x07\x10\x02\x02\u017C\u017A\x03\x02\x02\x02\u017C" +
		"\u017D\x03\x02\x02\x02\u017D\u017F\x03\x02\x02\x02\u017E\u0180\x07P\x02" +
		"\x02\u017F\u017E\x03\x02\x02\x02\u017F\u0180\x03\x02\x02\x02\u0180\u0187" +
		"\x03\x02\x02\x02\u0181\u0182\x07\x0E\x02\x02\u0182\u0184\x07\x10\x02\x02" +
		"\u0183\u0185\x07P\x02\x02\u0184\u0183\x03\x02\x02\x02\u0184\u0185\x03" +
		"\x02\x02\x02\u0185\u0187\x03\x02\x02\x02\u0186\u0179\x03\x02\x02\x02\u0186" +
		"\u0181\x03\x02\x02\x02\u0187\u0188\x03\x02\x02\x02\u0188\u0189\t\x05\x02" +
		"\x02\u01899\x03\x02\x02\x02\u018A\u018F\x05<\x1F\x02\u018B\u018C\x07\x19" +
		"\x02\x02\u018C\u018E\x05<\x1F\x02\u018D\u018B\x03\x02\x02\x02\u018E\u0191" +
		"\x03\x02\x02\x02\u018F\u018D\x03\x02\x02\x02\u018F\u0190\x03\x02\x02\x02" +
		"\u0190;\x03\x02\x02\x02\u0191\u018F\x03\x02\x02\x02\u0192\u0197\x05\x18" +
		"\r\x02\u0193\u0194\x07\x1A\x02\x02\u0194\u0196\x05\x18\r\x02\u0195\u0193" +
		"\x03\x02\x02\x02\u0196\u0199\x03\x02\x02\x02\u0197\u0195\x03\x02\x02\x02" +
		"\u0197\u0198\x03\x02\x02\x02\u0198=\x03\x02\x02\x02\u0199\u0197\x03\x02" +
		"\x02\x02\u019A\u019C\x05D#\x02\u019B\u019A\x03\x02\x02\x02\u019B\u019C" +
		"\x03\x02\x02\x02\u019C\u019D\x03\x02\x02\x02\u019D\u01A5\x05@!\x02\u019E" +
		"\u01A0\x07\"\x02\x02\u019F\u01A1\x05D#\x02\u01A0\u019F\x03\x02\x02\x02" +
		"\u01A0\u01A1\x03\x02\x02\x02\u01A1\u01A2\x03\x02\x02\x02\u01A2\u01A4\x05" +
		"@!\x02\u01A3\u019E\x03\x02\x02\x02\u01A4\u01A7\x03\x02\x02\x02\u01A5\u01A3" +
		"\x03\x02\x02\x02\u01A5\u01A6\x03\x02\x02\x02\u01A6?\x03\x02\x02\x02\u01A7" +
		"\u01A5\x03\x02\x02\x02\u01A8\u01A9\x05^0\x02\u01A9\u01AA\x05B\"\x02\u01AA" +
		"A\x03\x02\x02\x02\u01AB\u01AF\x07K\x02\x02\u01AC\u01AF\x05\b\x05\x02\u01AD" +
		"\u01AF\x05 \x11\x02\u01AE\u01AB\x03\x02\x02\x02\u01AE\u01AC\x03\x02\x02" +
		"\x02\u01AE\u01AD\x03\x02\x02\x02\u01AFC\x03\x02\x02\x02\u01B0\u01B1\x07" +
		"G\x02\x02\u01B1\u01B2\x05> \x02\u01B2E\x03\x02\x02\x02\u01B3\u01B5\x05" +
		"D#\x02\u01B4\u01B3\x03\x02\x02\x02\u01B4\u01B5\x03\x02\x02\x02\u01B5\u01B6" +
		"\x03\x02\x02\x02\u01B6\u01BB\x05\x02\x02\x02\u01B7\u01B8\x07\"\x02\x02" +
		"\u01B8\u01BA\x05F$\x02\u01B9\u01B7\x03\x02\x02\x02\u01BA\u01BD\x03\x02" +
		"\x02\x02\u01BB\u01B9\x03\x02\x02\x02\u01BB\u01BC\x03\x02\x02\x02\u01BC" +
		"G\x03\x02\x02\x02\u01BD\u01BB\x03\x02\x02\x02\u01BE\u01BF\x05\x02\x02" +
		"\x02\u01BF\u01C0\x07\"\x02\x02\u01C0\u01C1\x05J&\x02\u01C1I\x03\x02\x02" +
		"\x02\u01C2\u01C7\x05\x02\x02\x02\u01C3\u01C4\x07\"\x02\x02\u01C4\u01C6" +
		"\x05\x02\x02\x02\u01C5\u01C3\x03\x02\x02\x02\u01C6\u01C9\x03\x02\x02\x02" +
		"\u01C7\u01C5\x03\x02\x02\x02\u01C7\u01C8\x03\x02\x02\x02\u01C8K\x03\x02" +
		"\x02\x02\u01C9\u01C7\x03\x02\x02\x02\u01CA\u01CB\x07H\x02\x02\u01CB\u01DA" +
		"\x05\x10\t\x02\u01CC\u01CD\x07G\x02\x02\u01CD\u01D9\x05> \x02\u01CE\u01CF" +
		"\x07A\x02\x02\u01CF\u01D9\x05F$\x02\u01D0\u01D1\x07@\x02\x02\u01D1\u01D9" +
		"\x05F$\x02\u01D2\u01D3\x07B\x02\x02\u01D3\u01D9\x05F$\x02\u01D4\u01D5" +
		"\x07C\x02\x02\u01D5\u01D6\x05D#\x02\u01D6\u01D7\x05H%\x02\u01D7\u01D9" +
		"\x03\x02\x02\x02\u01D8\u01CC\x03\x02\x02\x02\u01D8\u01CE\x03\x02\x02\x02" +
		"\u01D8\u01D0\x03\x02\x02\x02\u01D8\u01D2\x03\x02\x02\x02\u01D8\u01D4\x03" +
		"\x02\x02\x02\u01D9\u01DC\x03\x02\x02\x02\u01DA\u01D8\x03\x02\x02\x02\u01DA" +
		"\u01DB\x03\x02\x02\x02\u01DB\u01E7\x03\x02\x02\x02\u01DC\u01DA\x03\x02" +
		"\x02\x02\u01DD\u01DF\x07D\x02\x02\u01DE\u01E0\x05D#\x02\u01DF\u01DE\x03" +
		"\x02\x02\x02\u01DF\u01E0\x03\x02\x02\x02\u01E0\u01E3\x03\x02\x02\x02\u01E1" +
		"\u01E4\x05\n\x06\x02\u01E2\u01E4\x05*\x16\x02\u01E3\u01E1\x03\x02\x02" +
		"\x02\u01E3\u01E2\x03\x02\x02\x02\u01E4\u01E5\x03\x02\x02\x02\u01E5\u01E3" +
		"\x03\x02\x02\x02\u01E5\u01E6\x03\x02\x02\x02\u01E6\u01E8\x03\x02\x02\x02" +
		"\u01E7\u01DD\x03\x02\x02\x02\u01E7\u01E8\x03\x02\x02\x02\u01E8M\x03\x02" +
		"\x02\x02\u01E9\u01EA\x07.\x02\x02\u01EA\u0204\x05\x84C\x02\u01EB\u01EC" +
		"\x07G\x02\x02\u01EC\u0203\x05> \x02\u01ED\u01EE\x07*\x02\x02\u01EE\u0203" +
		"\x05F$\x02\u01EF\u01F0\x07+\x02\x02\u01F0\u0203\x05P)\x02\u01F1\u01F2" +
		"\x07,\x02\x02\u01F2\u0203\x05R*\x02\u01F3\u01F4\x07@\x02\x02\u01F4\u0203" +
		"\x05R*\x02\u01F5\u01F6\x07B\x02\x02\u01F6\u0203\x05R*";
	private static readonly _serializedATNSegment1: string =
		"\x02\u01F7\u01F8\x07E\x02\x02\u01F8\u0203\x05R*\x02\u01F9\u01FA\x07-\x02" +
		"\x02\u01FA\u01FB\x05D#\x02\u01FB\u01FE\x05\n\x06\x02\u01FC\u01FD\x07\x05" +
		"\x02\x02\u01FD\u01FF\x05\n\x06\x02\u01FE\u01FC\x03\x02\x02\x02\u01FF\u0200" +
		"\x03\x02\x02\x02\u0200\u01FE\x03\x02\x02\x02\u0200\u0201\x03\x02\x02\x02" +
		"\u0201\u0203\x03\x02\x02\x02\u0202\u01EB\x03\x02\x02\x02\u0202\u01ED\x03" +
		"\x02\x02\x02\u0202\u01EF\x03\x02\x02\x02\u0202\u01F1\x03\x02\x02\x02\u0202" +
		"\u01F3\x03\x02\x02\x02\u0202\u01F5\x03\x02\x02\x02\u0202\u01F7\x03\x02" +
		"\x02\x02\u0202\u01F9\x03\x02\x02\x02\u0203\u0206\x03\x02\x02\x02\u0204" +
		"\u0202\x03\x02\x02\x02\u0204\u0205\x03\x02\x02\x02\u0205O\x03\x02\x02" +
		"\x02\u0206\u0204\x03\x02\x02\x02\u0207\u0209\x05D#\x02\u0208\u0207\x03" +
		"\x02\x02\x02\u0208\u0209\x03\x02\x02\x02\u0209\u020A\x03\x02\x02\x02\u020A" +
		"\u020F\x07I\x02\x02\u020B\u020C\x07\"\x02\x02\u020C\u020E\x05P)\x02\u020D" +
		"\u020B\x03\x02\x02\x02\u020E\u0211\x03\x02\x02\x02\u020F\u020D\x03\x02" +
		"\x02\x02\u020F\u0210\x03\x02\x02\x02\u0210Q\x03\x02\x02\x02\u0211\u020F" +
		"\x03\x02\x02\x02\u0212\u0214\x05D#\x02\u0213\u0212\x03\x02\x02\x02\u0213" +
		"\u0214\x03\x02\x02\x02\u0214\u0215\x03\x02\x02\x02\u0215\u021A\x05\n\x06" +
		"\x02\u0216\u0217\x07\"\x02\x02\u0217\u0219\x05R*\x02\u0218\u0216\x03\x02" +
		"\x02\x02\u0219\u021C\x03\x02\x02\x02\u021A\u0218\x03\x02\x02\x02\u021A" +
		"\u021B\x03\x02\x02\x02\u021BS\x03\x02\x02\x02\u021C\u021A\x03\x02\x02" +
		"\x02\u021D\u021E\x07/\x02\x02\u021E\u0231\x05\x80A\x02\u021F\u0220\x07" +
		"G\x02\x02\u0220\u0230\x05> \x02\u0221\u0222\x07T\x02\x02\u0222\u0230\x05" +
		"F$\x02\u0223\u0224\x07*\x02\x02\u0224\u0230\x05V,\x02\u0225\u0226\x07" +
		"+\x02\x02\u0226\u0227\x05D#\x02\u0227\u0228\x07U\x02\x02\u0228\u0230\x03" +
		"\x02\x02\x02\u0229\u022A\x07,\x02\x02\u022A\u0230\x05X-\x02\u022B\u022C" +
		"\x07@\x02\x02\u022C\u0230\x05X-\x02\u022D\u022E\x07B\x02\x02\u022E\u0230" +
		"\x05X-\x02\u022F\u021F\x03\x02\x02\x02\u022F\u0221\x03\x02\x02\x02\u022F" +
		"\u0223\x03\x02\x02\x02\u022F\u0225\x03\x02\x02\x02\u022F\u0229\x03\x02" +
		"\x02\x02\u022F\u022B\x03\x02\x02\x02\u022F\u022D\x03\x02\x02\x02\u0230" +
		"\u0233\x03\x02\x02\x02\u0231\u022F\x03\x02\x02\x02\u0231\u0232\x03\x02" +
		"\x02\x02\u0232U\x03\x02\x02\x02\u0233\u0231\x03\x02\x02\x02\u0234\u0236" +
		"\x05D#\x02\u0235\u0234\x03\x02\x02\x02\u0235\u0236\x03\x02\x02\x02\u0236" +
		"\u0237\x03\x02\x02\x02\u0237\u023C\x05:\x1E\x02\u0238\u0239\x07\"\x02" +
		"\x02\u0239\u023B\x05V,\x02\u023A\u0238\x03\x02\x02\x02\u023B\u023E\x03" +
		"\x02\x02\x02\u023C\u023A\x03\x02\x02\x02\u023C\u023D\x03\x02\x02\x02\u023D" +
		"W\x03\x02\x02\x02\u023E\u023C\x03\x02\x02\x02\u023F\u0241\x05D#\x02\u0240" +
		"\u023F\x03\x02\x02\x02\u0240\u0241\x03\x02\x02\x02\u0241\u0242\x03\x02" +
		"\x02\x02\u0242\u0247\x05*\x16\x02\u0243\u0244\x07\"\x02\x02\u0244\u0246" +
		"\x05X-\x02\u0245\u0243\x03\x02\x02\x02\u0246\u0249\x03\x02\x02\x02\u0247" +
		"\u0245\x03\x02\x02\x02\u0247\u0248\x03\x02\x02\x02\u0248Y\x03\x02\x02" +
		"\x02\u0249\u0247\x03\x02\x02\x02\u024A\u024B\x070\x02\x02\u024B\u0250" +
		"\x05^0\x02\u024C\u024D\x07G\x02\x02\u024D\u024F\x05> \x02\u024E\u024C" +
		"\x03\x02\x02\x02\u024F\u0252\x03\x02\x02\x02\u0250\u024E\x03\x02\x02\x02" +
		"\u0250\u0251\x03\x02\x02\x02\u0251\u025A\x03\x02\x02\x02\u0252\u0250\x03" +
		"\x02\x02\x02\u0253\u0254\x07T\x02\x02\u0254\u025A\x05\\/\x02\u0255\u0256" +
		"\x07*\x02\x02\u0256\u025A\x05\\/\x02\u0257\u0258\x07,\x02\x02\u0258\u025A" +
		"\x05`1\x02\u0259\u024A\x03\x02\x02\x02\u0259\u0253\x03\x02\x02\x02\u0259" +
		"\u0255\x03\x02\x02\x02\u0259\u0257\x03\x02\x02\x02\u025A[\x03\x02\x02" +
		"\x02\u025B\u025D\x05D#\x02\u025C\u025B\x03\x02\x02\x02\u025C\u025D\x03" +
		"\x02\x02\x02\u025D\u025E\x03\x02\x02\x02\u025E\u0263\x05\b\x05\x02\u025F" +
		"\u0260\x07\"\x02\x02\u0260\u0262\x05\\/\x02\u0261\u025F\x03\x02\x02\x02" +
		"\u0262\u0265\x03\x02\x02\x02\u0263\u0261\x03\x02\x02\x02\u0263\u0264\x03" +
		"\x02\x02\x02\u0264]\x03\x02\x02\x02\u0265\u0263\x03\x02\x02\x02\u0266" +
		"\u0267\x05\b\x05\x02\u0267_\x03\x02\x02\x02\u0268\u026A\x05D#\x02\u0269" +
		"\u0268\x03\x02\x02\x02\u0269\u026A\x03\x02\x02\x02\u026A\u026B\x03\x02" +
		"\x02\x02\u026B\u0270\x05^0\x02\u026C\u026D\x07\"\x02\x02\u026D\u026F\x05" +
		"`1\x02\u026E\u026C\x03\x02\x02\x02\u026F\u0272\x03\x02\x02\x02\u0270\u026E" +
		"\x03\x02\x02\x02\u0270\u0271\x03\x02\x02\x02\u0271a\x03\x02\x02\x02\u0272" +
		"\u0270\x03\x02\x02\x02\u0273\u0274\x074\x02\x02\u0274\u0281\x05\x14\v" +
		"\x02\u0275\u0276\x07G\x02\x02\u0276\u0280\x05> \x02\u0277\u0278\x075\x02" +
		"\x02\u0278\u0280\x05F$\x02\u0279\u027A\x076\x02\x02\u027A\u0280\x05d3" +
		"\x02\u027B\u027C\x077\x02\x02\u027C\u0280\x05f4\x02\u027D\u027E\x078\x02" +
		"\x02\u027E\u0280\x05f4\x02\u027F\u0275\x03\x02\x02\x02\u027F\u0277\x03" +
		"\x02\x02\x02\u027F\u0279\x03\x02\x02\x02\u027F\u027B\x03\x02\x02\x02\u027F" +
		"\u027D\x03\x02\x02\x02\u0280\u0283\x03\x02\x02\x02\u0281\u027F\x03\x02" +
		"\x02\x02\u0281\u0282\x03\x02\x02\x02\u0282c\x03\x02\x02\x02\u0283\u0281" +
		"\x03\x02\x02\x02\u0284\u0286\x05D#\x02\u0285\u0284\x03\x02\x02\x02\u0285" +
		"\u0286\x03\x02\x02\x02\u0286\u0287\x03\x02\x02\x02\u0287\u028C\x05h5\x02" +
		"\u0288\u0289\x07\"\x02\x02\u0289\u028B\x05d3\x02\u028A\u0288\x03\x02\x02" +
		"\x02\u028B\u028E\x03\x02\x02\x02\u028C\u028A\x03\x02\x02\x02\u028C\u028D" +
		"\x03\x02\x02\x02\u028De\x03\x02\x02\x02\u028E\u028C\x03\x02\x02\x02\u028F" +
		"\u0291\x05D#\x02\u0290\u028F\x03\x02\x02\x02\u0290\u0291\x03\x02\x02\x02" +
		"\u0291\u0292\x03\x02\x02\x02\u0292\u0297\x05\x14\v\x02\u0293\u0294\x07" +
		"\"\x02\x02\u0294\u0296\x05f4\x02\u0295\u0293\x03\x02\x02\x02\u0296\u0299" +
		"\x03\x02\x02\x02\u0297\u0295\x03\x02\x02\x02\u0297\u0298\x03\x02\x02\x02" +
		"\u0298g\x03\x02\x02\x02\u0299\u0297\x03\x02\x02\x02\u029A\u029C\x07\x11" +
		"\x02\x02\u029B\u029A\x03\x02\x02\x02\u029B\u029C\x03\x02\x02\x02\u029C" +
		"\u029F\x03\x02\x02\x02\u029D\u02A0\x05j6\x02\u029E\u02A0\x05l7\x02\u029F" +
		"\u029D\x03\x02\x02\x02\u029F\u029E\x03\x02\x02\x02\u02A0i\x03\x02\x02" +
		"\x02\u02A1\u02A2\x05\x84C\x02\u02A2\u02A3\x05\x14\v\x02\u02A3k\x03\x02" +
		"\x02\x02\u02A4\u02A5\x05\x80A\x02\u02A5\u02A6\x05 \x11\x02\u02A6m\x03" +
		"\x02\x02\x02\u02A7\u02A8\x079\x02\x02\u02A8\u02AD\x05\x1E\x10\x02\u02A9" +
		"\u02AA\x07G\x02\x02\u02AA\u02AC\x05> \x02\u02AB\u02A9\x03\x02\x02\x02" +
		"\u02AC\u02AF\x03\x02\x02\x02\u02AD\u02AB\x03\x02\x02\x02\u02AD\u02AE\x03" +
		"\x02\x02\x02\u02AE\u02B4\x03\x02\x02\x02\u02AF\u02AD\x03\x02\x02\x02\u02B0" +
		"\u02B1\x07@\x02\x02\u02B1\u02B2\x05D#\x02\u02B2\u02B3\x05:\x1E\x02\u02B3" +
		"\u02B5\x03\x02\x02\x02\u02B4\u02B0\x03\x02\x02\x02\u02B4\u02B5\x03\x02" +
		"\x02\x02\u02B5\u02BA\x03\x02\x02\x02\u02B6\u02B7\x07G\x02\x02\u02B7\u02B9" +
		"\x05> \x02\u02B8\u02B6\x03\x02\x02\x02\u02B9\u02BC\x03\x02\x02\x02\u02BA" +
		"\u02B8\x03\x02\x02\x02\u02BA\u02BB\x03\x02\x02\x02\u02BBo\x03\x02\x02" +
		"\x02\u02BC\u02BA\x03\x02\x02\x02\u02BD\u02BE\x07:\x02\x02\u02BE\u02BF" +
		"\x05D#\x02\u02BF\u02C0\x05H%\x02\u02C0\u02DE\x03\x02\x02\x02\u02C1\u02C2" +
		"\x07;\x02\x02\u02C2\u02C3\x05D#\x02\u02C3\u02C4\x05H%\x02\u02C4\u02DE" +
		"\x03\x02\x02\x02\u02C5\u02C6\x07<\x02\x02\u02C6\u02C7\x05D#\x02\u02C7" +
		"\u02C8\x05x=\x02\u02C8\u02DE\x03\x02\x02\x02\u02C9\u02CA\x07=\x02\x02" +
		"\u02CA\u02CB\x05D#\x02\u02CB\u02CC\x05x=\x02\u02CC\u02DE\x03\x02\x02\x02" +
		"\u02CD\u02CE\x07<\x02\x02\u02CE\u02CF\x05D#\x02\u02CF\u02D0\x05t;\x02" +
		"\u02D0\u02DE\x03\x02\x02\x02\u02D1\u02D2\x07=\x02\x02\u02D2\u02D3\x05" +
		"D#\x02\u02D3\u02D4\x05t;\x02\u02D4\u02DE\x03\x02\x02\x02\u02D5\u02D6\x07" +
		">\x02\x02\u02D6\u02D7\x05D#\x02\u02D7\u02D8\x05r:\x02\u02D8\u02DE\x03" +
		"\x02\x02\x02\u02D9\u02DA\x07?\x02\x02\u02DA\u02DB\x05D#\x02\u02DB\u02DC" +
		"\x05r:\x02\u02DC\u02DE\x03\x02\x02\x02\u02DD\u02BD\x03\x02\x02\x02\u02DD" +
		"\u02C1\x03\x02\x02\x02\u02DD\u02C5\x03\x02\x02\x02\u02DD\u02C9\x03\x02" +
		"\x02\x02\u02DD\u02CD\x03\x02\x02\x02\u02DD\u02D1\x03\x02\x02\x02\u02DD" +
		"\u02D5\x03\x02\x02\x02\u02DD\u02D9\x03\x02\x02\x02\u02DEq\x03\x02\x02" +
		"\x02\u02DF\u02E0\x05\x14\v\x02\u02E0\u02E1\x07\"\x02\x02\u02E1\u02E2\x05" +
		"\x12\n\x02\u02E2s\x03\x02\x02\x02\u02E3\u02E4\x05~@\x02\u02E4\u02E5\x07" +
		"\"\x02\x02\u02E5\u02E6\x05v<\x02\u02E6u\x03\x02\x02\x02\u02E7\u02EC\x05" +
		"~@\x02\u02E8\u02E9\x07\"\x02\x02\u02E9\u02EB\x05~@\x02\u02EA\u02E8\x03" +
		"\x02\x02\x02\u02EB\u02EE\x03\x02\x02\x02\u02EC\u02EA\x03\x02\x02\x02\u02EC" +
		"\u02ED\x03\x02\x02\x02\u02EDw\x03\x02\x02\x02\u02EE\u02EC\x03\x02\x02" +
		"\x02\u02EF\u02F0\x05|?\x02\u02F0\u02F1\x07\"\x02\x02\u02F1\u02F2\x05z" +
		">\x02\u02F2y\x03\x02\x02\x02\u02F3\u02F8\x05|?\x02\u02F4\u02F5\x07\"\x02" +
		"\x02\u02F5\u02F7\x05|?\x02\u02F6\u02F4\x03\x02\x02\x02\u02F7\u02FA\x03" +
		"\x02\x02\x02\u02F8\u02F6\x03\x02\x02\x02\u02F8\u02F9\x03\x02\x02\x02\u02F9" +
		"{\x03\x02\x02\x02\u02FA\u02F8\x03\x02\x02\x02\u02FB\u02FC\x05\x84C\x02" +
		"\u02FC}\x03\x02\x02\x02\u02FD\u02FE\x05\x80A\x02\u02FE\x7F\x03\x02\x02" +
		"\x02\u02FF\u0300\x05\b\x05\x02\u0300\x81\x03\x02\x02\x02\u0301\u0302\x05" +
		"\b\x05\x02\u0302\x83\x03\x02\x02\x02\u0303\u0304\x05\b\x05\x02\u0304\x85" +
		"\x03\x02\x02\x02\u0305\u030D\x05n8\x02\u0306\u030D\x05L\'\x02\u0307\u030D" +
		"\x05N(\x02\u0308\u030D\x05T+\x02\u0309\u030D\x05Z.\x02\u030A\u030D\x05" +
		"b2\x02\u030B\u030D\x05p9\x02\u030C\u0305\x03\x02\x02\x02\u030C\u0306\x03" +
		"\x02\x02\x02\u030C\u0307\x03\x02\x02\x02\u030C\u0308\x03\x02\x02\x02\u030C" +
		"\u0309\x03\x02\x02\x02\u030C\u030A\x03\x02\x02\x02\u030C\u030B\x03\x02" +
		"\x02\x02\u030D\x87\x03\x02\x02\x02\u030E\u030F\x079\x02\x02\u030F\u0310" +
		"\x07#\x02\x02\u0310\u0311\x05\x1E\x10\x02\u0311\u0312\x07$\x02\x02\u0312" +
		"\u032D\x03\x02\x02\x02\u0313\u0314\x07H\x02\x02\u0314\u0315\x07#\x02\x02" +
		"\u0315\u0316\x05\x10\t\x02\u0316\u0317\x07$\x02\x02\u0317\u032D\x03\x02" +
		"\x02\x02\u0318\u0319\x07.\x02\x02\u0319\u031A\x07#\x02\x02\u031A\u031B" +
		"\x05\x84C\x02\u031B\u031C\x07$\x02\x02\u031C\u032D\x03\x02\x02\x02\u031D" +
		"\u031E\x07/\x02\x02\u031E\u031F\x07#\x02\x02\u031F\u0320\x05\x8CG\x02" +
		"\u0320\u0321\x07$\x02\x02\u0321\u032D\x03\x02\x02\x02\u0322\u0323\x07" +
		"0\x02\x02\u0323\u0324\x07#\x02\x02\u0324\u0325\x05^0\x02\u0325\u0326\x07" +
		"$\x02\x02\u0326\u032D\x03\x02\x02\x02\u0327\u0328\x071\x02\x02\u0328\u0329" +
		"\x07#\x02\x02\u0329\u032A\x05\x8AF\x02\u032A\u032B\x07$\x02\x02\u032B" +
		"\u032D\x03\x02\x02\x02\u032C\u030E\x03\x02\x02\x02\u032C\u0313\x03\x02" +
		"\x02\x02\u032C\u0318\x03\x02\x02\x02\u032C\u031D\x03\x02\x02\x02\u032C" +
		"\u0322\x03\x02\x02\x02\u032C\u0327\x03\x02\x02\x02\u032D\x89\x03\x02\x02" +
		"\x02\u032E\u032F\x05\b\x05\x02\u032F\x8B\x03\x02\x02\x02\u0330\u0331\x05" +
		"\b\x05\x02\u0331\x8D\x03\x02\x02\x02\u0332\u0334\x05\x90I\x02\u0333\u0332" +
		"\x03\x02\x02\x02\u0334\u0337\x03\x02\x02\x02\u0335\u0333\x03\x02\x02\x02" +
		"\u0335\u0336\x03\x02\x02\x02\u0336\u0338\x03\x02\x02\x02\u0337\u0335\x03" +
		"\x02\x02\x02\u0338\u0339\x05\x92J\x02\u0339\x8F\x03\x02\x02\x02\u033A" +
		"\u033B\x072\x02\x02\u033B\u033C\x07Q\x02\x02\u033C\u033D\x07J\x02\x02" +
		"\u033D\x91\x03\x02\x02\x02\u033E\u0343\x073\x02\x02\u033F\u0341\x05\x94" +
		"K\x02\u0340\u0342\x05\x96L\x02\u0341\u0340\x03\x02\x02\x02\u0341\u0342" +
		"\x03\x02\x02\x02\u0342\u0344\x03\x02\x02\x02\u0343\u033F\x03\x02\x02\x02" +
		"\u0343\u0344\x03\x02\x02\x02\u0344\u0348\x03\x02\x02\x02\u0345\u0347\x05" +
		"\x98M\x02\u0346\u0345\x03\x02\x02\x02\u0347\u034A\x03\x02\x02\x02\u0348" +
		"\u0346\x03\x02\x02\x02\u0348\u0349\x03\x02\x02\x02\u0349\u034E\x03\x02" +
		"\x02\x02\u034A\u0348\x03\x02\x02\x02\u034B\u034D\x05D#\x02\u034C\u034B" +
		"\x03\x02\x02\x02\u034D\u0350\x03\x02\x02\x02\u034E\u034C\x03\x02\x02\x02" +
		"\u034E\u034F\x03\x02\x02\x02\u034F\u0354\x03\x02\x02\x02\u0350\u034E\x03" +
		"\x02\x02\x02\u0351\u0353\x05\x86D\x02\u0352\u0351\x03\x02\x02\x02\u0353" +
		"\u0356\x03\x02\x02\x02\u0354\u0352\x03\x02\x02\x02\u0354\u0355\x03\x02" +
		"\x02\x02\u0355\x93\x03\x02\x02\x02\u0356\u0354\x03\x02\x02\x02\u0357\u0358" +
		"\x05\b\x05\x02\u0358\x95\x03\x02\x02\x02\u0359\u035A\x05\b\x05\x02\u035A" +
		"\x97\x03\x02\x02\x02\u035B\u035C\x07F\x02\x02\u035C\u035D\x05\b\x05\x02" +
		"\u035D\x99\x03\x02\x02\x02X\x9F\xA7\xB1\xB4\xB7\xBB\xC1\xD6\xDC\xE2\xF4" +
		"\xFA\u0100\u0102\u010D\u0116\u011B\u0120\u012E\u0135\u013D\u0145\u015E" +
		"\u016B\u0172\u0177\u017C\u017F\u0184\u0186\u018F\u0197\u019B\u01A0\u01A5" +
		"\u01AE\u01B4\u01BB\u01C7\u01D8\u01DA\u01DF\u01E3\u01E5\u01E7\u0200\u0202" +
		"\u0204\u0208\u020F\u0213\u021A\u022F\u0231\u0235\u023C\u0240\u0247\u0250" +
		"\u0259\u025C\u0263\u0269\u0270\u027F\u0281\u0285\u028C\u0290\u0297\u029B" +
		"\u029F\u02AD\u02B4\u02BA\u02DD\u02EC\u02F8\u030C\u032C\u0335\u0341\u0343" +
		"\u0348\u034E\u0354";
	public static readonly _serializedATN: string = Utils.join(
		[
			MOSParser._serializedATNSegment0,
			MOSParser._serializedATNSegment1,
		],
		"",
	);
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!MOSParser.__ATN) {
			MOSParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(MOSParser._serializedATN));
		}

		return MOSParser.__ATN;
	}

}

export class DescriptionContext extends ParserRuleContext {
	public conjunction(): ConjunctionContext[];
	public conjunction(i: number): ConjunctionContext;
	public conjunction(i?: number): ConjunctionContext | ConjunctionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ConjunctionContext);
		} else {
			return this.getRuleContext(i, ConjunctionContext);
		}
	}
	public OR_LABEL(): TerminalNode[];
	public OR_LABEL(i: number): TerminalNode;
	public OR_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.OR_LABEL);
		} else {
			return this.getToken(MOSParser.OR_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_description; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDescription) {
			listener.enterDescription(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDescription) {
			listener.exitDescription(this);
		}
	}
}


export class ConjunctionContext extends ParserRuleContext {
	public primary(): PrimaryContext[];
	public primary(i: number): PrimaryContext;
	public primary(i?: number): PrimaryContext | PrimaryContext[] {
		if (i === undefined) {
			return this.getRuleContexts(PrimaryContext);
		} else {
			return this.getRuleContext(i, PrimaryContext);
		}
	}
	public AND_LABEL(): TerminalNode[];
	public AND_LABEL(i: number): TerminalNode;
	public AND_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.AND_LABEL);
		} else {
			return this.getToken(MOSParser.AND_LABEL, i);
		}
	}
	public classIRI(): ClassIRIContext | undefined {
		return this.tryGetRuleContext(0, ClassIRIContext);
	}
	public THAT_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.THAT_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_conjunction; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterConjunction) {
			listener.enterConjunction(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitConjunction) {
			listener.exitConjunction(this);
		}
	}
}


export class PrimaryContext extends ParserRuleContext {
	public restriction(): RestrictionContext | undefined {
		return this.tryGetRuleContext(0, RestrictionContext);
	}
	public atomic(): AtomicContext | undefined {
		return this.tryGetRuleContext(0, AtomicContext);
	}
	public NOT_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NOT_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_primary; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterPrimary) {
			listener.enterPrimary(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitPrimary) {
			listener.exitPrimary(this);
		}
	}
}


export class IriContext extends ParserRuleContext {
	public FULL_IRI(): TerminalNode | undefined { return this.tryGetToken(MOSParser.FULL_IRI, 0); }
	public ABBREVIATED_IRI(): TerminalNode | undefined { return this.tryGetToken(MOSParser.ABBREVIATED_IRI, 0); }
	public SIMPLE_IRI(): TerminalNode | undefined { return this.tryGetToken(MOSParser.SIMPLE_IRI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_iri; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIri) {
			listener.enterIri(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIri) {
			listener.exitIri(this);
		}
	}
}


export class ObjectPropertyExpressionContext extends ParserRuleContext {
	public objectPropertyIRI(): ObjectPropertyIRIContext | undefined {
		return this.tryGetRuleContext(0, ObjectPropertyIRIContext);
	}
	public inverseObjectProperty(): InverseObjectPropertyContext | undefined {
		return this.tryGetRuleContext(0, InverseObjectPropertyContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyExpression; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyExpression) {
			listener.enterObjectPropertyExpression(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyExpression) {
			listener.exitObjectPropertyExpression(this);
		}
	}
}


export class RestrictionContext extends ParserRuleContext {
	public objectPropertyExpression(): ObjectPropertyExpressionContext | undefined {
		return this.tryGetRuleContext(0, ObjectPropertyExpressionContext);
	}
	public SOME_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.SOME_LABEL, 0); }
	public primary(): PrimaryContext | undefined {
		return this.tryGetRuleContext(0, PrimaryContext);
	}
	public ONLY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.ONLY_LABEL, 0); }
	public VALUE_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.VALUE_LABEL, 0); }
	public individual(): IndividualContext | undefined {
		return this.tryGetRuleContext(0, IndividualContext);
	}
	public SELF_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.SELF_LABEL, 0); }
	public MIN_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MIN_LABEL, 0); }
	public nonNegativeInteger(): NonNegativeIntegerContext | undefined {
		return this.tryGetRuleContext(0, NonNegativeIntegerContext);
	}
	public MAX_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MAX_LABEL, 0); }
	public EXACTLY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.EXACTLY_LABEL, 0); }
	public dataPropertyExpression(): DataPropertyExpressionContext | undefined {
		return this.tryGetRuleContext(0, DataPropertyExpressionContext);
	}
	public dataPrimary(): DataPrimaryContext | undefined {
		return this.tryGetRuleContext(0, DataPrimaryContext);
	}
	public literal(): LiteralContext | undefined {
		return this.tryGetRuleContext(0, LiteralContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_restriction; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterRestriction) {
			listener.enterRestriction(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitRestriction) {
			listener.exitRestriction(this);
		}
	}
}


export class AtomicContext extends ParserRuleContext {
	public classIRI(): ClassIRIContext | undefined {
		return this.tryGetRuleContext(0, ClassIRIContext);
	}
	public OPEN_CURLY_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.OPEN_CURLY_BRACE, 0); }
	public individualList(): IndividualListContext | undefined {
		return this.tryGetRuleContext(0, IndividualListContext);
	}
	public CLOSE_CURLY_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.CLOSE_CURLY_BRACE, 0); }
	public OPEN_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.OPEN_BRACE, 0); }
	public description(): DescriptionContext | undefined {
		return this.tryGetRuleContext(0, DescriptionContext);
	}
	public CLOSE_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.CLOSE_BRACE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_atomic; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAtomic) {
			listener.enterAtomic(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAtomic) {
			listener.exitAtomic(this);
		}
	}
}


export class ClassIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_classIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterClassIRI) {
			listener.enterClassIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitClassIRI) {
			listener.exitClassIRI(this);
		}
	}
}


export class IndividualListContext extends ParserRuleContext {
	public individual(): IndividualContext[];
	public individual(i: number): IndividualContext;
	public individual(i?: number): IndividualContext | IndividualContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IndividualContext);
		} else {
			return this.getRuleContext(i, IndividualContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individualList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividualList) {
			listener.enterIndividualList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividualList) {
			listener.exitIndividualList(this);
		}
	}
}


export class IndividualContext extends ParserRuleContext {
	public individualIRI(): IndividualIRIContext | undefined {
		return this.tryGetRuleContext(0, IndividualIRIContext);
	}
	public NODE_ID(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NODE_ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individual; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividual) {
			listener.enterIndividual(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividual) {
			listener.exitIndividual(this);
		}
	}
}


export class NonNegativeIntegerContext extends ParserRuleContext {
	public DIGITS(): TerminalNode { return this.getToken(MOSParser.DIGITS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_nonNegativeInteger; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterNonNegativeInteger) {
			listener.enterNonNegativeInteger(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitNonNegativeInteger) {
			listener.exitNonNegativeInteger(this);
		}
	}
}


export class DataPrimaryContext extends ParserRuleContext {
	public dataAtomic(): DataAtomicContext {
		return this.getRuleContext(0, DataAtomicContext);
	}
	public NOT_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NOT_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPrimary; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPrimary) {
			listener.enterDataPrimary(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPrimary) {
			listener.exitDataPrimary(this);
		}
	}
}


export class DataAtomicContext extends ParserRuleContext {
	public dataType(): DataTypeContext | undefined {
		return this.tryGetRuleContext(0, DataTypeContext);
	}
	public OPEN_CURLY_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.OPEN_CURLY_BRACE, 0); }
	public literalList(): LiteralListContext | undefined {
		return this.tryGetRuleContext(0, LiteralListContext);
	}
	public CLOSE_CURLY_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.CLOSE_CURLY_BRACE, 0); }
	public dataTypeRestriction(): DataTypeRestrictionContext | undefined {
		return this.tryGetRuleContext(0, DataTypeRestrictionContext);
	}
	public OPEN_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.OPEN_BRACE, 0); }
	public dataRange(): DataRangeContext | undefined {
		return this.tryGetRuleContext(0, DataRangeContext);
	}
	public CLOSE_BRACE(): TerminalNode | undefined { return this.tryGetToken(MOSParser.CLOSE_BRACE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataAtomic; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataAtomic) {
			listener.enterDataAtomic(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataAtomic) {
			listener.exitDataAtomic(this);
		}
	}
}


export class LiteralListContext extends ParserRuleContext {
	public literal(): LiteralContext[];
	public literal(i: number): LiteralContext;
	public literal(i?: number): LiteralContext | LiteralContext[] {
		if (i === undefined) {
			return this.getRuleContexts(LiteralContext);
		} else {
			return this.getRuleContext(i, LiteralContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_literalList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterLiteralList) {
			listener.enterLiteralList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitLiteralList) {
			listener.exitLiteralList(this);
		}
	}
}


export class DataTypeContext extends ParserRuleContext {
	public datatypeIRI(): DatatypeIRIContext | undefined {
		return this.tryGetRuleContext(0, DatatypeIRIContext);
	}
	public INTEGER_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.INTEGER_LABEL, 0); }
	public DECIMAL_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DECIMAL_LABEL, 0); }
	public FLOAT_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.FLOAT_LABEL, 0); }
	public STRING_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.STRING_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataType; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataType) {
			listener.enterDataType(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataType) {
			listener.exitDataType(this);
		}
	}
}


export class LiteralContext extends ParserRuleContext {
	public typedLiteral(): TypedLiteralContext | undefined {
		return this.tryGetRuleContext(0, TypedLiteralContext);
	}
	public stringLiteralNoLanguage(): StringLiteralNoLanguageContext | undefined {
		return this.tryGetRuleContext(0, StringLiteralNoLanguageContext);
	}
	public stringLiteralWithLanguage(): StringLiteralWithLanguageContext | undefined {
		return this.tryGetRuleContext(0, StringLiteralWithLanguageContext);
	}
	public integerLiteral(): IntegerLiteralContext | undefined {
		return this.tryGetRuleContext(0, IntegerLiteralContext);
	}
	public decimalLiteral(): DecimalLiteralContext | undefined {
		return this.tryGetRuleContext(0, DecimalLiteralContext);
	}
	public floatingPointLiteral(): FloatingPointLiteralContext | undefined {
		return this.tryGetRuleContext(0, FloatingPointLiteralContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_literal; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterLiteral) {
			listener.enterLiteral(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitLiteral) {
			listener.exitLiteral(this);
		}
	}
}


export class TypedLiteralContext extends ParserRuleContext {
	public lexicalValue(): LexicalValueContext {
		return this.getRuleContext(0, LexicalValueContext);
	}
	public REFERENCE(): TerminalNode { return this.getToken(MOSParser.REFERENCE, 0); }
	public dataType(): DataTypeContext {
		return this.getRuleContext(0, DataTypeContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_typedLiteral; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterTypedLiteral) {
			listener.enterTypedLiteral(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitTypedLiteral) {
			listener.exitTypedLiteral(this);
		}
	}
}


export class StringLiteralNoLanguageContext extends ParserRuleContext {
	public QUOTED_STRING(): TerminalNode { return this.getToken(MOSParser.QUOTED_STRING, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_stringLiteralNoLanguage; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterStringLiteralNoLanguage) {
			listener.enterStringLiteralNoLanguage(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitStringLiteralNoLanguage) {
			listener.exitStringLiteralNoLanguage(this);
		}
	}
}


export class StringLiteralWithLanguageContext extends ParserRuleContext {
	public QUOTED_STRING(): TerminalNode { return this.getToken(MOSParser.QUOTED_STRING, 0); }
	public LANGUAGE_TAG(): TerminalNode { return this.getToken(MOSParser.LANGUAGE_TAG, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_stringLiteralWithLanguage; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterStringLiteralWithLanguage) {
			listener.enterStringLiteralWithLanguage(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitStringLiteralWithLanguage) {
			listener.exitStringLiteralWithLanguage(this);
		}
	}
}


export class LexicalValueContext extends ParserRuleContext {
	public QUOTED_STRING(): TerminalNode { return this.getToken(MOSParser.QUOTED_STRING, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_lexicalValue; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterLexicalValue) {
			listener.enterLexicalValue(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitLexicalValue) {
			listener.exitLexicalValue(this);
		}
	}
}


export class DataPropertyExpressionContext extends ParserRuleContext {
	public dataPropertyIRI(): DataPropertyIRIContext {
		return this.getRuleContext(0, DataPropertyIRIContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyExpression; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyExpression) {
			listener.enterDataPropertyExpression(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyExpression) {
			listener.exitDataPropertyExpression(this);
		}
	}
}


export class DataTypeRestrictionContext extends ParserRuleContext {
	public dataType(): DataTypeContext {
		return this.getRuleContext(0, DataTypeContext);
	}
	public OPEN_SQUARE_BRACE(): TerminalNode { return this.getToken(MOSParser.OPEN_SQUARE_BRACE, 0); }
	public facet(): FacetContext[];
	public facet(i: number): FacetContext;
	public facet(i?: number): FacetContext | FacetContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FacetContext);
		} else {
			return this.getRuleContext(i, FacetContext);
		}
	}
	public restrictionValue(): RestrictionValueContext[];
	public restrictionValue(i: number): RestrictionValueContext;
	public restrictionValue(i?: number): RestrictionValueContext | RestrictionValueContext[] {
		if (i === undefined) {
			return this.getRuleContexts(RestrictionValueContext);
		} else {
			return this.getRuleContext(i, RestrictionValueContext);
		}
	}
	public CLOSE_SQUARE_BRACE(): TerminalNode { return this.getToken(MOSParser.CLOSE_SQUARE_BRACE, 0); }
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataTypeRestriction; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataTypeRestriction) {
			listener.enterDataTypeRestriction(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataTypeRestriction) {
			listener.exitDataTypeRestriction(this);
		}
	}
}


export class FacetContext extends ParserRuleContext {
	public LENGTH_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.LENGTH_LABEL, 0); }
	public MIN_LENGTH_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MIN_LENGTH_LABEL, 0); }
	public MAX_LENGTH_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MAX_LENGTH_LABEL, 0); }
	public PATTERN_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.PATTERN_LABEL, 0); }
	public LANG_PATTERN_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.LANG_PATTERN_LABEL, 0); }
	public LESS_EQUAL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.LESS_EQUAL, 0); }
	public LESS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.LESS, 0); }
	public GREATER_EQUAL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.GREATER_EQUAL, 0); }
	public GREATER(): TerminalNode | undefined { return this.tryGetToken(MOSParser.GREATER, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_facet; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterFacet) {
			listener.enterFacet(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitFacet) {
			listener.exitFacet(this);
		}
	}
}


export class RestrictionValueContext extends ParserRuleContext {
	public literal(): LiteralContext {
		return this.getRuleContext(0, LiteralContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_restrictionValue; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterRestrictionValue) {
			listener.enterRestrictionValue(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitRestrictionValue) {
			listener.exitRestrictionValue(this);
		}
	}
}


export class InverseObjectPropertyContext extends ParserRuleContext {
	public INVERSE_LABEL(): TerminalNode { return this.getToken(MOSParser.INVERSE_LABEL, 0); }
	public objectPropertyIRI(): ObjectPropertyIRIContext {
		return this.getRuleContext(0, ObjectPropertyIRIContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_inverseObjectProperty; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterInverseObjectProperty) {
			listener.enterInverseObjectProperty(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitInverseObjectProperty) {
			listener.exitInverseObjectProperty(this);
		}
	}
}


export class DecimalLiteralContext extends ParserRuleContext {
	public DIGITS(): TerminalNode[];
	public DIGITS(i: number): TerminalNode;
	public DIGITS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DIGITS);
		} else {
			return this.getToken(MOSParser.DIGITS, i);
		}
	}
	public DOT(): TerminalNode { return this.getToken(MOSParser.DOT, 0); }
	public PLUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.PLUS, 0); }
	public MINUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MINUS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_decimalLiteral; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDecimalLiteral) {
			listener.enterDecimalLiteral(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDecimalLiteral) {
			listener.exitDecimalLiteral(this);
		}
	}
}


export class IntegerLiteralContext extends ParserRuleContext {
	public DIGITS(): TerminalNode { return this.getToken(MOSParser.DIGITS, 0); }
	public PLUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.PLUS, 0); }
	public MINUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MINUS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_integerLiteral; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIntegerLiteral) {
			listener.enterIntegerLiteral(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIntegerLiteral) {
			listener.exitIntegerLiteral(this);
		}
	}
}


export class FloatingPointLiteralContext extends ParserRuleContext {
	public LOWER_FLOAT_SUFFIX(): TerminalNode | undefined { return this.tryGetToken(MOSParser.LOWER_FLOAT_SUFFIX, 0); }
	public UPPER_FLOAT_SUFFIX(): TerminalNode | undefined { return this.tryGetToken(MOSParser.UPPER_FLOAT_SUFFIX, 0); }
	public DOT(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DOT, 0); }
	public DIGITS(): TerminalNode[];
	public DIGITS(i: number): TerminalNode;
	public DIGITS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DIGITS);
		} else {
			return this.getToken(MOSParser.DIGITS, i);
		}
	}
	public PLUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.PLUS, 0); }
	public MINUS(): TerminalNode | undefined { return this.tryGetToken(MOSParser.MINUS, 0); }
	public EXPONENT(): TerminalNode | undefined { return this.tryGetToken(MOSParser.EXPONENT, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_floatingPointLiteral; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterFloatingPointLiteral) {
			listener.enterFloatingPointLiteral(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitFloatingPointLiteral) {
			listener.exitFloatingPointLiteral(this);
		}
	}
}


export class DataRangeContext extends ParserRuleContext {
	public dataConjunction(): DataConjunctionContext[];
	public dataConjunction(i: number): DataConjunctionContext;
	public dataConjunction(i?: number): DataConjunctionContext | DataConjunctionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataConjunctionContext);
		} else {
			return this.getRuleContext(i, DataConjunctionContext);
		}
	}
	public OR_LABEL(): TerminalNode[];
	public OR_LABEL(i: number): TerminalNode;
	public OR_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.OR_LABEL);
		} else {
			return this.getToken(MOSParser.OR_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataRange; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataRange) {
			listener.enterDataRange(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataRange) {
			listener.exitDataRange(this);
		}
	}
}


export class DataConjunctionContext extends ParserRuleContext {
	public dataPrimary(): DataPrimaryContext[];
	public dataPrimary(i: number): DataPrimaryContext;
	public dataPrimary(i?: number): DataPrimaryContext | DataPrimaryContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataPrimaryContext);
		} else {
			return this.getRuleContext(i, DataPrimaryContext);
		}
	}
	public AND_LABEL(): TerminalNode[];
	public AND_LABEL(i: number): TerminalNode;
	public AND_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.AND_LABEL);
		} else {
			return this.getToken(MOSParser.AND_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataConjunction; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataConjunction) {
			listener.enterDataConjunction(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataConjunction) {
			listener.exitDataConjunction(this);
		}
	}
}


export class AnnotationAnnotatedListContext extends ParserRuleContext {
	public annotation(): AnnotationContext[];
	public annotation(i: number): AnnotationContext;
	public annotation(i?: number): AnnotationContext | AnnotationContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationContext);
		} else {
			return this.getRuleContext(i, AnnotationContext);
		}
	}
	public annotations(): AnnotationsContext[];
	public annotations(i: number): AnnotationsContext;
	public annotations(i?: number): AnnotationsContext | AnnotationsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationsContext);
		} else {
			return this.getRuleContext(i, AnnotationsContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotationAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotationAnnotatedList) {
			listener.enterAnnotationAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotationAnnotatedList) {
			listener.exitAnnotationAnnotatedList(this);
		}
	}
}


export class AnnotationContext extends ParserRuleContext {
	public annotationPropertyIRI(): AnnotationPropertyIRIContext {
		return this.getRuleContext(0, AnnotationPropertyIRIContext);
	}
	public annotationTarget(): AnnotationTargetContext {
		return this.getRuleContext(0, AnnotationTargetContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotation; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotation) {
			listener.enterAnnotation(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotation) {
			listener.exitAnnotation(this);
		}
	}
}


export class AnnotationTargetContext extends ParserRuleContext {
	public NODE_ID(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NODE_ID, 0); }
	public iri(): IriContext | undefined {
		return this.tryGetRuleContext(0, IriContext);
	}
	public literal(): LiteralContext | undefined {
		return this.tryGetRuleContext(0, LiteralContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotationTarget; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotationTarget) {
			listener.enterAnnotationTarget(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotationTarget) {
			listener.exitAnnotationTarget(this);
		}
	}
}


export class AnnotationsContext extends ParserRuleContext {
	public ANNOTATIONS_LABEL(): TerminalNode { return this.getToken(MOSParser.ANNOTATIONS_LABEL, 0); }
	public annotationAnnotatedList(): AnnotationAnnotatedListContext {
		return this.getRuleContext(0, AnnotationAnnotatedListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotations; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotations) {
			listener.enterAnnotations(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotations) {
			listener.exitAnnotations(this);
		}
	}
}


export class DescriptionAnnotatedListContext extends ParserRuleContext {
	public description(): DescriptionContext {
		return this.getRuleContext(0, DescriptionContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext[];
	public descriptionAnnotatedList(i: number): DescriptionAnnotatedListContext;
	public descriptionAnnotatedList(i?: number): DescriptionAnnotatedListContext | DescriptionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DescriptionAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_descriptionAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDescriptionAnnotatedList) {
			listener.enterDescriptionAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDescriptionAnnotatedList) {
			listener.exitDescriptionAnnotatedList(this);
		}
	}
}


export class Description2ListContext extends ParserRuleContext {
	public description(): DescriptionContext {
		return this.getRuleContext(0, DescriptionContext);
	}
	public COMMA(): TerminalNode { return this.getToken(MOSParser.COMMA, 0); }
	public descriptionList(): DescriptionListContext {
		return this.getRuleContext(0, DescriptionListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_description2List; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDescription2List) {
			listener.enterDescription2List(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDescription2List) {
			listener.exitDescription2List(this);
		}
	}
}


export class DescriptionListContext extends ParserRuleContext {
	public description(): DescriptionContext[];
	public description(i: number): DescriptionContext;
	public description(i?: number): DescriptionContext | DescriptionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionContext);
		} else {
			return this.getRuleContext(i, DescriptionContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_descriptionList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDescriptionList) {
			listener.enterDescriptionList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDescriptionList) {
			listener.exitDescriptionList(this);
		}
	}
}


export class ClassFrameContext extends ParserRuleContext {
	public CLASS_LABEL(): TerminalNode { return this.getToken(MOSParser.CLASS_LABEL, 0); }
	public classIRI(): ClassIRIContext {
		return this.getRuleContext(0, ClassIRIContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public SUBCLASS_OF_LABEL(): TerminalNode[];
	public SUBCLASS_OF_LABEL(i: number): TerminalNode;
	public SUBCLASS_OF_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.SUBCLASS_OF_LABEL);
		} else {
			return this.getToken(MOSParser.SUBCLASS_OF_LABEL, i);
		}
	}
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext[];
	public descriptionAnnotatedList(i: number): DescriptionAnnotatedListContext;
	public descriptionAnnotatedList(i?: number): DescriptionAnnotatedListContext | DescriptionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DescriptionAnnotatedListContext);
		}
	}
	public EQUIVALENT_TO_LABEL(): TerminalNode[];
	public EQUIVALENT_TO_LABEL(i: number): TerminalNode;
	public EQUIVALENT_TO_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.EQUIVALENT_TO_LABEL);
		} else {
			return this.getToken(MOSParser.EQUIVALENT_TO_LABEL, i);
		}
	}
	public DISJOINT_WITH_LABEL(): TerminalNode[];
	public DISJOINT_WITH_LABEL(i: number): TerminalNode;
	public DISJOINT_WITH_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DISJOINT_WITH_LABEL);
		} else {
			return this.getToken(MOSParser.DISJOINT_WITH_LABEL, i);
		}
	}
	public DISJOINT_UNION_OF_LABEL(): TerminalNode[];
	public DISJOINT_UNION_OF_LABEL(i: number): TerminalNode;
	public DISJOINT_UNION_OF_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DISJOINT_UNION_OF_LABEL);
		} else {
			return this.getToken(MOSParser.DISJOINT_UNION_OF_LABEL, i);
		}
	}
	public annotations(): AnnotationsContext[];
	public annotations(i: number): AnnotationsContext;
	public annotations(i?: number): AnnotationsContext | AnnotationsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationsContext);
		} else {
			return this.getRuleContext(i, AnnotationsContext);
		}
	}
	public description2List(): Description2ListContext[];
	public description2List(i: number): Description2ListContext;
	public description2List(i?: number): Description2ListContext | Description2ListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Description2ListContext);
		} else {
			return this.getRuleContext(i, Description2ListContext);
		}
	}
	public HAS_KEY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.HAS_KEY_LABEL, 0); }
	public objectPropertyExpression(): ObjectPropertyExpressionContext[];
	public objectPropertyExpression(i: number): ObjectPropertyExpressionContext;
	public objectPropertyExpression(i?: number): ObjectPropertyExpressionContext | ObjectPropertyExpressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyExpressionContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyExpressionContext);
		}
	}
	public dataPropertyExpression(): DataPropertyExpressionContext[];
	public dataPropertyExpression(i: number): DataPropertyExpressionContext;
	public dataPropertyExpression(i?: number): DataPropertyExpressionContext | DataPropertyExpressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataPropertyExpressionContext);
		} else {
			return this.getRuleContext(i, DataPropertyExpressionContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_classFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterClassFrame) {
			listener.enterClassFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitClassFrame) {
			listener.exitClassFrame(this);
		}
	}
}


export class ObjectPropertyFrameContext extends ParserRuleContext {
	public OBJECT_PROPERTY_LABEL(): TerminalNode { return this.getToken(MOSParser.OBJECT_PROPERTY_LABEL, 0); }
	public objectPropertyIRI(): ObjectPropertyIRIContext {
		return this.getRuleContext(0, ObjectPropertyIRIContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public RANGE_LABEL(): TerminalNode[];
	public RANGE_LABEL(i: number): TerminalNode;
	public RANGE_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.RANGE_LABEL);
		} else {
			return this.getToken(MOSParser.RANGE_LABEL, i);
		}
	}
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext[];
	public descriptionAnnotatedList(i: number): DescriptionAnnotatedListContext;
	public descriptionAnnotatedList(i?: number): DescriptionAnnotatedListContext | DescriptionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DescriptionAnnotatedListContext);
		}
	}
	public CHARACTERISTICS_LABEL(): TerminalNode[];
	public CHARACTERISTICS_LABEL(i: number): TerminalNode;
	public CHARACTERISTICS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.CHARACTERISTICS_LABEL);
		} else {
			return this.getToken(MOSParser.CHARACTERISTICS_LABEL, i);
		}
	}
	public objectPropertyCharacteristicAnnotatedList(): ObjectPropertyCharacteristicAnnotatedListContext[];
	public objectPropertyCharacteristicAnnotatedList(i: number): ObjectPropertyCharacteristicAnnotatedListContext;
	public objectPropertyCharacteristicAnnotatedList(i?: number): ObjectPropertyCharacteristicAnnotatedListContext | ObjectPropertyCharacteristicAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyCharacteristicAnnotatedListContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyCharacteristicAnnotatedListContext);
		}
	}
	public SUB_PROPERTY_OF_LABEL(): TerminalNode[];
	public SUB_PROPERTY_OF_LABEL(i: number): TerminalNode;
	public SUB_PROPERTY_OF_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.SUB_PROPERTY_OF_LABEL);
		} else {
			return this.getToken(MOSParser.SUB_PROPERTY_OF_LABEL, i);
		}
	}
	public objectPropertyExpressionAnnotatedList(): ObjectPropertyExpressionAnnotatedListContext[];
	public objectPropertyExpressionAnnotatedList(i: number): ObjectPropertyExpressionAnnotatedListContext;
	public objectPropertyExpressionAnnotatedList(i?: number): ObjectPropertyExpressionAnnotatedListContext | ObjectPropertyExpressionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyExpressionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyExpressionAnnotatedListContext);
		}
	}
	public EQUIVALENT_TO_LABEL(): TerminalNode[];
	public EQUIVALENT_TO_LABEL(i: number): TerminalNode;
	public EQUIVALENT_TO_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.EQUIVALENT_TO_LABEL);
		} else {
			return this.getToken(MOSParser.EQUIVALENT_TO_LABEL, i);
		}
	}
	public DISJOINT_WITH_LABEL(): TerminalNode[];
	public DISJOINT_WITH_LABEL(i: number): TerminalNode;
	public DISJOINT_WITH_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DISJOINT_WITH_LABEL);
		} else {
			return this.getToken(MOSParser.DISJOINT_WITH_LABEL, i);
		}
	}
	public INVERSE_OF_LABEL(): TerminalNode[];
	public INVERSE_OF_LABEL(i: number): TerminalNode;
	public INVERSE_OF_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.INVERSE_OF_LABEL);
		} else {
			return this.getToken(MOSParser.INVERSE_OF_LABEL, i);
		}
	}
	public SUB_PROPERTY_CHAIN_LABEL(): TerminalNode[];
	public SUB_PROPERTY_CHAIN_LABEL(i: number): TerminalNode;
	public SUB_PROPERTY_CHAIN_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.SUB_PROPERTY_CHAIN_LABEL);
		} else {
			return this.getToken(MOSParser.SUB_PROPERTY_CHAIN_LABEL, i);
		}
	}
	public annotations(): AnnotationsContext[];
	public annotations(i: number): AnnotationsContext;
	public annotations(i?: number): AnnotationsContext | AnnotationsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationsContext);
		} else {
			return this.getRuleContext(i, AnnotationsContext);
		}
	}
	public objectPropertyExpression(): ObjectPropertyExpressionContext[];
	public objectPropertyExpression(i: number): ObjectPropertyExpressionContext;
	public objectPropertyExpression(i?: number): ObjectPropertyExpressionContext | ObjectPropertyExpressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyExpressionContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyExpressionContext);
		}
	}
	public O_LABEL(): TerminalNode[];
	public O_LABEL(i: number): TerminalNode;
	public O_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.O_LABEL);
		} else {
			return this.getToken(MOSParser.O_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyFrame) {
			listener.enterObjectPropertyFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyFrame) {
			listener.exitObjectPropertyFrame(this);
		}
	}
}


export class ObjectPropertyCharacteristicAnnotatedListContext extends ParserRuleContext {
	public OBJECT_PROPERTY_CHARACTERISTIC(): TerminalNode { return this.getToken(MOSParser.OBJECT_PROPERTY_CHARACTERISTIC, 0); }
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public objectPropertyCharacteristicAnnotatedList(): ObjectPropertyCharacteristicAnnotatedListContext[];
	public objectPropertyCharacteristicAnnotatedList(i: number): ObjectPropertyCharacteristicAnnotatedListContext;
	public objectPropertyCharacteristicAnnotatedList(i?: number): ObjectPropertyCharacteristicAnnotatedListContext | ObjectPropertyCharacteristicAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyCharacteristicAnnotatedListContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyCharacteristicAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyCharacteristicAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyCharacteristicAnnotatedList) {
			listener.enterObjectPropertyCharacteristicAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyCharacteristicAnnotatedList) {
			listener.exitObjectPropertyCharacteristicAnnotatedList(this);
		}
	}
}


export class ObjectPropertyExpressionAnnotatedListContext extends ParserRuleContext {
	public objectPropertyExpression(): ObjectPropertyExpressionContext {
		return this.getRuleContext(0, ObjectPropertyExpressionContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public objectPropertyExpressionAnnotatedList(): ObjectPropertyExpressionAnnotatedListContext[];
	public objectPropertyExpressionAnnotatedList(i: number): ObjectPropertyExpressionAnnotatedListContext;
	public objectPropertyExpressionAnnotatedList(i?: number): ObjectPropertyExpressionAnnotatedListContext | ObjectPropertyExpressionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyExpressionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyExpressionAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyExpressionAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyExpressionAnnotatedList) {
			listener.enterObjectPropertyExpressionAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyExpressionAnnotatedList) {
			listener.exitObjectPropertyExpressionAnnotatedList(this);
		}
	}
}


export class DataPropertyFrameContext extends ParserRuleContext {
	public DATA_PROPERTY_LABEL(): TerminalNode { return this.getToken(MOSParser.DATA_PROPERTY_LABEL, 0); }
	public dataPropertyIRI(): DataPropertyIRIContext {
		return this.getRuleContext(0, DataPropertyIRIContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public DOMAIN_LABEL(): TerminalNode[];
	public DOMAIN_LABEL(i: number): TerminalNode;
	public DOMAIN_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DOMAIN_LABEL);
		} else {
			return this.getToken(MOSParser.DOMAIN_LABEL, i);
		}
	}
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext[];
	public descriptionAnnotatedList(i: number): DescriptionAnnotatedListContext;
	public descriptionAnnotatedList(i?: number): DescriptionAnnotatedListContext | DescriptionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DescriptionAnnotatedListContext);
		}
	}
	public RANGE_LABEL(): TerminalNode[];
	public RANGE_LABEL(i: number): TerminalNode;
	public RANGE_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.RANGE_LABEL);
		} else {
			return this.getToken(MOSParser.RANGE_LABEL, i);
		}
	}
	public dataRangeAnnotatedList(): DataRangeAnnotatedListContext[];
	public dataRangeAnnotatedList(i: number): DataRangeAnnotatedListContext;
	public dataRangeAnnotatedList(i?: number): DataRangeAnnotatedListContext | DataRangeAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataRangeAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DataRangeAnnotatedListContext);
		}
	}
	public CHARACTERISTICS_LABEL(): TerminalNode[];
	public CHARACTERISTICS_LABEL(i: number): TerminalNode;
	public CHARACTERISTICS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.CHARACTERISTICS_LABEL);
		} else {
			return this.getToken(MOSParser.CHARACTERISTICS_LABEL, i);
		}
	}
	public annotations(): AnnotationsContext[];
	public annotations(i: number): AnnotationsContext;
	public annotations(i?: number): AnnotationsContext | AnnotationsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationsContext);
		} else {
			return this.getRuleContext(i, AnnotationsContext);
		}
	}
	public FUNCTIONAL_LABEL(): TerminalNode[];
	public FUNCTIONAL_LABEL(i: number): TerminalNode;
	public FUNCTIONAL_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.FUNCTIONAL_LABEL);
		} else {
			return this.getToken(MOSParser.FUNCTIONAL_LABEL, i);
		}
	}
	public SUB_PROPERTY_OF_LABEL(): TerminalNode[];
	public SUB_PROPERTY_OF_LABEL(i: number): TerminalNode;
	public SUB_PROPERTY_OF_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.SUB_PROPERTY_OF_LABEL);
		} else {
			return this.getToken(MOSParser.SUB_PROPERTY_OF_LABEL, i);
		}
	}
	public dataPropertyExpressionAnnotatedList(): DataPropertyExpressionAnnotatedListContext[];
	public dataPropertyExpressionAnnotatedList(i: number): DataPropertyExpressionAnnotatedListContext;
	public dataPropertyExpressionAnnotatedList(i?: number): DataPropertyExpressionAnnotatedListContext | DataPropertyExpressionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataPropertyExpressionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DataPropertyExpressionAnnotatedListContext);
		}
	}
	public EQUIVALENT_TO_LABEL(): TerminalNode[];
	public EQUIVALENT_TO_LABEL(i: number): TerminalNode;
	public EQUIVALENT_TO_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.EQUIVALENT_TO_LABEL);
		} else {
			return this.getToken(MOSParser.EQUIVALENT_TO_LABEL, i);
		}
	}
	public DISJOINT_WITH_LABEL(): TerminalNode[];
	public DISJOINT_WITH_LABEL(i: number): TerminalNode;
	public DISJOINT_WITH_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DISJOINT_WITH_LABEL);
		} else {
			return this.getToken(MOSParser.DISJOINT_WITH_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyFrame) {
			listener.enterDataPropertyFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyFrame) {
			listener.exitDataPropertyFrame(this);
		}
	}
}


export class DataRangeAnnotatedListContext extends ParserRuleContext {
	public dataRange(): DataRangeContext {
		return this.getRuleContext(0, DataRangeContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public dataRangeAnnotatedList(): DataRangeAnnotatedListContext[];
	public dataRangeAnnotatedList(i: number): DataRangeAnnotatedListContext;
	public dataRangeAnnotatedList(i?: number): DataRangeAnnotatedListContext | DataRangeAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataRangeAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DataRangeAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataRangeAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataRangeAnnotatedList) {
			listener.enterDataRangeAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataRangeAnnotatedList) {
			listener.exitDataRangeAnnotatedList(this);
		}
	}
}


export class DataPropertyExpressionAnnotatedListContext extends ParserRuleContext {
	public dataPropertyExpression(): DataPropertyExpressionContext {
		return this.getRuleContext(0, DataPropertyExpressionContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public dataPropertyExpressionAnnotatedList(): DataPropertyExpressionAnnotatedListContext[];
	public dataPropertyExpressionAnnotatedList(i: number): DataPropertyExpressionAnnotatedListContext;
	public dataPropertyExpressionAnnotatedList(i?: number): DataPropertyExpressionAnnotatedListContext | DataPropertyExpressionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataPropertyExpressionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DataPropertyExpressionAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyExpressionAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyExpressionAnnotatedList) {
			listener.enterDataPropertyExpressionAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyExpressionAnnotatedList) {
			listener.exitDataPropertyExpressionAnnotatedList(this);
		}
	}
}


export class AnnotationPropertyFrameContext extends ParserRuleContext {
	public ANNOTATION_PROPERTY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.ANNOTATION_PROPERTY_LABEL, 0); }
	public annotationPropertyIRI(): AnnotationPropertyIRIContext | undefined {
		return this.tryGetRuleContext(0, AnnotationPropertyIRIContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public DOMAIN_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DOMAIN_LABEL, 0); }
	public iriAnnotatedList(): IriAnnotatedListContext | undefined {
		return this.tryGetRuleContext(0, IriAnnotatedListContext);
	}
	public RANGE_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.RANGE_LABEL, 0); }
	public SUB_PROPERTY_OF_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.SUB_PROPERTY_OF_LABEL, 0); }
	public annotationPropertyIRIAnnotatedList(): AnnotationPropertyIRIAnnotatedListContext | undefined {
		return this.tryGetRuleContext(0, AnnotationPropertyIRIAnnotatedListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotationPropertyFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotationPropertyFrame) {
			listener.enterAnnotationPropertyFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotationPropertyFrame) {
			listener.exitAnnotationPropertyFrame(this);
		}
	}
}


export class IriAnnotatedListContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public iriAnnotatedList(): IriAnnotatedListContext[];
	public iriAnnotatedList(i: number): IriAnnotatedListContext;
	public iriAnnotatedList(i?: number): IriAnnotatedListContext | IriAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IriAnnotatedListContext);
		} else {
			return this.getRuleContext(i, IriAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_iriAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIriAnnotatedList) {
			listener.enterIriAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIriAnnotatedList) {
			listener.exitIriAnnotatedList(this);
		}
	}
}


export class AnnotationPropertyIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotationPropertyIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotationPropertyIRI) {
			listener.enterAnnotationPropertyIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotationPropertyIRI) {
			listener.exitAnnotationPropertyIRI(this);
		}
	}
}


export class AnnotationPropertyIRIAnnotatedListContext extends ParserRuleContext {
	public annotationPropertyIRI(): AnnotationPropertyIRIContext {
		return this.getRuleContext(0, AnnotationPropertyIRIContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public annotationPropertyIRIAnnotatedList(): AnnotationPropertyIRIAnnotatedListContext[];
	public annotationPropertyIRIAnnotatedList(i: number): AnnotationPropertyIRIAnnotatedListContext;
	public annotationPropertyIRIAnnotatedList(i?: number): AnnotationPropertyIRIAnnotatedListContext | AnnotationPropertyIRIAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationPropertyIRIAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationPropertyIRIAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_annotationPropertyIRIAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterAnnotationPropertyIRIAnnotatedList) {
			listener.enterAnnotationPropertyIRIAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitAnnotationPropertyIRIAnnotatedList) {
			listener.exitAnnotationPropertyIRIAnnotatedList(this);
		}
	}
}


export class IndividualFrameContext extends ParserRuleContext {
	public INDIVIDUAL_LABEL(): TerminalNode { return this.getToken(MOSParser.INDIVIDUAL_LABEL, 0); }
	public individual(): IndividualContext {
		return this.getRuleContext(0, IndividualContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public TYPES_LABEL(): TerminalNode[];
	public TYPES_LABEL(i: number): TerminalNode;
	public TYPES_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.TYPES_LABEL);
		} else {
			return this.getToken(MOSParser.TYPES_LABEL, i);
		}
	}
	public descriptionAnnotatedList(): DescriptionAnnotatedListContext[];
	public descriptionAnnotatedList(i: number): DescriptionAnnotatedListContext;
	public descriptionAnnotatedList(i?: number): DescriptionAnnotatedListContext | DescriptionAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DescriptionAnnotatedListContext);
		} else {
			return this.getRuleContext(i, DescriptionAnnotatedListContext);
		}
	}
	public FACTS_LABEL(): TerminalNode[];
	public FACTS_LABEL(i: number): TerminalNode;
	public FACTS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.FACTS_LABEL);
		} else {
			return this.getToken(MOSParser.FACTS_LABEL, i);
		}
	}
	public factAnnotatedList(): FactAnnotatedListContext[];
	public factAnnotatedList(i: number): FactAnnotatedListContext;
	public factAnnotatedList(i?: number): FactAnnotatedListContext | FactAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FactAnnotatedListContext);
		} else {
			return this.getRuleContext(i, FactAnnotatedListContext);
		}
	}
	public SAME_AS_LABEL(): TerminalNode[];
	public SAME_AS_LABEL(i: number): TerminalNode;
	public SAME_AS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.SAME_AS_LABEL);
		} else {
			return this.getToken(MOSParser.SAME_AS_LABEL, i);
		}
	}
	public individualAnnotatedList(): IndividualAnnotatedListContext[];
	public individualAnnotatedList(i: number): IndividualAnnotatedListContext;
	public individualAnnotatedList(i?: number): IndividualAnnotatedListContext | IndividualAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IndividualAnnotatedListContext);
		} else {
			return this.getRuleContext(i, IndividualAnnotatedListContext);
		}
	}
	public DIFFERENET_FROM_LABEL(): TerminalNode[];
	public DIFFERENET_FROM_LABEL(i: number): TerminalNode;
	public DIFFERENET_FROM_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.DIFFERENET_FROM_LABEL);
		} else {
			return this.getToken(MOSParser.DIFFERENET_FROM_LABEL, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individualFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividualFrame) {
			listener.enterIndividualFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividualFrame) {
			listener.exitIndividualFrame(this);
		}
	}
}


export class FactAnnotatedListContext extends ParserRuleContext {
	public fact(): FactContext {
		return this.getRuleContext(0, FactContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public factAnnotatedList(): FactAnnotatedListContext[];
	public factAnnotatedList(i: number): FactAnnotatedListContext;
	public factAnnotatedList(i?: number): FactAnnotatedListContext | FactAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FactAnnotatedListContext);
		} else {
			return this.getRuleContext(i, FactAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_factAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterFactAnnotatedList) {
			listener.enterFactAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitFactAnnotatedList) {
			listener.exitFactAnnotatedList(this);
		}
	}
}


export class IndividualAnnotatedListContext extends ParserRuleContext {
	public individual(): IndividualContext {
		return this.getRuleContext(0, IndividualContext);
	}
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	public individualAnnotatedList(): IndividualAnnotatedListContext[];
	public individualAnnotatedList(i: number): IndividualAnnotatedListContext;
	public individualAnnotatedList(i?: number): IndividualAnnotatedListContext | IndividualAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(IndividualAnnotatedListContext);
		} else {
			return this.getRuleContext(i, IndividualAnnotatedListContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individualAnnotatedList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividualAnnotatedList) {
			listener.enterIndividualAnnotatedList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividualAnnotatedList) {
			listener.exitIndividualAnnotatedList(this);
		}
	}
}


export class FactContext extends ParserRuleContext {
	public objectPropertyFact(): ObjectPropertyFactContext | undefined {
		return this.tryGetRuleContext(0, ObjectPropertyFactContext);
	}
	public dataPropertyFact(): DataPropertyFactContext | undefined {
		return this.tryGetRuleContext(0, DataPropertyFactContext);
	}
	public NOT_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NOT_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_fact; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterFact) {
			listener.enterFact(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitFact) {
			listener.exitFact(this);
		}
	}
}


export class ObjectPropertyFactContext extends ParserRuleContext {
	public objectPropertyIRI(): ObjectPropertyIRIContext {
		return this.getRuleContext(0, ObjectPropertyIRIContext);
	}
	public individual(): IndividualContext {
		return this.getRuleContext(0, IndividualContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyFact; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyFact) {
			listener.enterObjectPropertyFact(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyFact) {
			listener.exitObjectPropertyFact(this);
		}
	}
}


export class DataPropertyFactContext extends ParserRuleContext {
	public dataPropertyIRI(): DataPropertyIRIContext {
		return this.getRuleContext(0, DataPropertyIRIContext);
	}
	public literal(): LiteralContext {
		return this.getRuleContext(0, LiteralContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyFact; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyFact) {
			listener.enterDataPropertyFact(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyFact) {
			listener.exitDataPropertyFact(this);
		}
	}
}


export class DatatypeFrameContext extends ParserRuleContext {
	public DATATYPE_LABEL(): TerminalNode { return this.getToken(MOSParser.DATATYPE_LABEL, 0); }
	public dataType(): DataTypeContext {
		return this.getRuleContext(0, DataTypeContext);
	}
	public ANNOTATIONS_LABEL(): TerminalNode[];
	public ANNOTATIONS_LABEL(i: number): TerminalNode;
	public ANNOTATIONS_LABEL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.ANNOTATIONS_LABEL);
		} else {
			return this.getToken(MOSParser.ANNOTATIONS_LABEL, i);
		}
	}
	public annotationAnnotatedList(): AnnotationAnnotatedListContext[];
	public annotationAnnotatedList(i: number): AnnotationAnnotatedListContext;
	public annotationAnnotatedList(i?: number): AnnotationAnnotatedListContext | AnnotationAnnotatedListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationAnnotatedListContext);
		} else {
			return this.getRuleContext(i, AnnotationAnnotatedListContext);
		}
	}
	public EQUIVALENT_TO_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.EQUIVALENT_TO_LABEL, 0); }
	public annotations(): AnnotationsContext | undefined {
		return this.tryGetRuleContext(0, AnnotationsContext);
	}
	public dataRange(): DataRangeContext | undefined {
		return this.tryGetRuleContext(0, DataRangeContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_datatypeFrame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDatatypeFrame) {
			listener.enterDatatypeFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDatatypeFrame) {
			listener.exitDatatypeFrame(this);
		}
	}
}


export class MiscContext extends ParserRuleContext {
	public EQUIVALENT_CLASSES_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.EQUIVALENT_CLASSES_LABEL, 0); }
	public annotations(): AnnotationsContext {
		return this.getRuleContext(0, AnnotationsContext);
	}
	public description2List(): Description2ListContext | undefined {
		return this.tryGetRuleContext(0, Description2ListContext);
	}
	public DISJOINT_CLASSES_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DISJOINT_CLASSES_LABEL, 0); }
	public EQUIVALENT_PROPERTIES_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.EQUIVALENT_PROPERTIES_LABEL, 0); }
	public objectProperty2List(): ObjectProperty2ListContext | undefined {
		return this.tryGetRuleContext(0, ObjectProperty2ListContext);
	}
	public DISJOINT_PROPERTIES_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DISJOINT_PROPERTIES_LABEL, 0); }
	public dataProperty2List(): DataProperty2ListContext | undefined {
		return this.tryGetRuleContext(0, DataProperty2ListContext);
	}
	public SAME_INDIVIDUAL_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.SAME_INDIVIDUAL_LABEL, 0); }
	public individual2List(): Individual2ListContext | undefined {
		return this.tryGetRuleContext(0, Individual2ListContext);
	}
	public DIFFERENT_INDIVIDUALS_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DIFFERENT_INDIVIDUALS_LABEL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_misc; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterMisc) {
			listener.enterMisc(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitMisc) {
			listener.exitMisc(this);
		}
	}
}


export class Individual2ListContext extends ParserRuleContext {
	public individual(): IndividualContext {
		return this.getRuleContext(0, IndividualContext);
	}
	public COMMA(): TerminalNode { return this.getToken(MOSParser.COMMA, 0); }
	public individualList(): IndividualListContext {
		return this.getRuleContext(0, IndividualListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individual2List; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividual2List) {
			listener.enterIndividual2List(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividual2List) {
			listener.exitIndividual2List(this);
		}
	}
}


export class DataProperty2ListContext extends ParserRuleContext {
	public dataProperty(): DataPropertyContext {
		return this.getRuleContext(0, DataPropertyContext);
	}
	public COMMA(): TerminalNode { return this.getToken(MOSParser.COMMA, 0); }
	public dataPropertyList(): DataPropertyListContext {
		return this.getRuleContext(0, DataPropertyListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataProperty2List; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataProperty2List) {
			listener.enterDataProperty2List(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataProperty2List) {
			listener.exitDataProperty2List(this);
		}
	}
}


export class DataPropertyListContext extends ParserRuleContext {
	public dataProperty(): DataPropertyContext[];
	public dataProperty(i: number): DataPropertyContext;
	public dataProperty(i?: number): DataPropertyContext | DataPropertyContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DataPropertyContext);
		} else {
			return this.getRuleContext(i, DataPropertyContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyList) {
			listener.enterDataPropertyList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyList) {
			listener.exitDataPropertyList(this);
		}
	}
}


export class ObjectProperty2ListContext extends ParserRuleContext {
	public objectProperty(): ObjectPropertyContext {
		return this.getRuleContext(0, ObjectPropertyContext);
	}
	public COMMA(): TerminalNode { return this.getToken(MOSParser.COMMA, 0); }
	public objectPropertyList(): ObjectPropertyListContext {
		return this.getRuleContext(0, ObjectPropertyListContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectProperty2List; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectProperty2List) {
			listener.enterObjectProperty2List(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectProperty2List) {
			listener.exitObjectProperty2List(this);
		}
	}
}


export class ObjectPropertyListContext extends ParserRuleContext {
	public objectProperty(): ObjectPropertyContext[];
	public objectProperty(i: number): ObjectPropertyContext;
	public objectProperty(i?: number): ObjectPropertyContext | ObjectPropertyContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ObjectPropertyContext);
		} else {
			return this.getRuleContext(i, ObjectPropertyContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(MOSParser.COMMA);
		} else {
			return this.getToken(MOSParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyList; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyList) {
			listener.enterObjectPropertyList(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyList) {
			listener.exitObjectPropertyList(this);
		}
	}
}


export class ObjectPropertyContext extends ParserRuleContext {
	public objectPropertyIRI(): ObjectPropertyIRIContext {
		return this.getRuleContext(0, ObjectPropertyIRIContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectProperty; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectProperty) {
			listener.enterObjectProperty(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectProperty) {
			listener.exitObjectProperty(this);
		}
	}
}


export class DataPropertyContext extends ParserRuleContext {
	public dataPropertyIRI(): DataPropertyIRIContext {
		return this.getRuleContext(0, DataPropertyIRIContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataProperty; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataProperty) {
			listener.enterDataProperty(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataProperty) {
			listener.exitDataProperty(this);
		}
	}
}


export class DataPropertyIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_dataPropertyIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDataPropertyIRI) {
			listener.enterDataPropertyIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDataPropertyIRI) {
			listener.exitDataPropertyIRI(this);
		}
	}
}


export class DatatypeIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_datatypeIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDatatypeIRI) {
			listener.enterDatatypeIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDatatypeIRI) {
			listener.exitDatatypeIRI(this);
		}
	}
}


export class ObjectPropertyIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_objectPropertyIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterObjectPropertyIRI) {
			listener.enterObjectPropertyIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitObjectPropertyIRI) {
			listener.exitObjectPropertyIRI(this);
		}
	}
}


export class FrameContext extends ParserRuleContext {
	public datatypeFrame(): DatatypeFrameContext | undefined {
		return this.tryGetRuleContext(0, DatatypeFrameContext);
	}
	public classFrame(): ClassFrameContext | undefined {
		return this.tryGetRuleContext(0, ClassFrameContext);
	}
	public objectPropertyFrame(): ObjectPropertyFrameContext | undefined {
		return this.tryGetRuleContext(0, ObjectPropertyFrameContext);
	}
	public dataPropertyFrame(): DataPropertyFrameContext | undefined {
		return this.tryGetRuleContext(0, DataPropertyFrameContext);
	}
	public annotationPropertyFrame(): AnnotationPropertyFrameContext | undefined {
		return this.tryGetRuleContext(0, AnnotationPropertyFrameContext);
	}
	public individualFrame(): IndividualFrameContext | undefined {
		return this.tryGetRuleContext(0, IndividualFrameContext);
	}
	public misc(): MiscContext | undefined {
		return this.tryGetRuleContext(0, MiscContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_frame; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterFrame) {
			listener.enterFrame(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitFrame) {
			listener.exitFrame(this);
		}
	}
}


export class EntityContext extends ParserRuleContext {
	public DATATYPE_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DATATYPE_LABEL, 0); }
	public OPEN_BRACE(): TerminalNode { return this.getToken(MOSParser.OPEN_BRACE, 0); }
	public dataType(): DataTypeContext | undefined {
		return this.tryGetRuleContext(0, DataTypeContext);
	}
	public CLOSE_BRACE(): TerminalNode { return this.getToken(MOSParser.CLOSE_BRACE, 0); }
	public CLASS_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.CLASS_LABEL, 0); }
	public classIRI(): ClassIRIContext | undefined {
		return this.tryGetRuleContext(0, ClassIRIContext);
	}
	public OBJECT_PROPERTY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.OBJECT_PROPERTY_LABEL, 0); }
	public objectPropertyIRI(): ObjectPropertyIRIContext | undefined {
		return this.tryGetRuleContext(0, ObjectPropertyIRIContext);
	}
	public DATA_PROPERTY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.DATA_PROPERTY_LABEL, 0); }
	public datatypePropertyIRI(): DatatypePropertyIRIContext | undefined {
		return this.tryGetRuleContext(0, DatatypePropertyIRIContext);
	}
	public ANNOTATION_PROPERTY_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.ANNOTATION_PROPERTY_LABEL, 0); }
	public annotationPropertyIRI(): AnnotationPropertyIRIContext | undefined {
		return this.tryGetRuleContext(0, AnnotationPropertyIRIContext);
	}
	public NAMED_INDIVIDUAL_LABEL(): TerminalNode | undefined { return this.tryGetToken(MOSParser.NAMED_INDIVIDUAL_LABEL, 0); }
	public individualIRI(): IndividualIRIContext | undefined {
		return this.tryGetRuleContext(0, IndividualIRIContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_entity; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterEntity) {
			listener.enterEntity(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitEntity) {
			listener.exitEntity(this);
		}
	}
}


export class IndividualIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_individualIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterIndividualIRI) {
			listener.enterIndividualIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitIndividualIRI) {
			listener.exitIndividualIRI(this);
		}
	}
}


export class DatatypePropertyIRIContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_datatypePropertyIRI; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterDatatypePropertyIRI) {
			listener.enterDatatypePropertyIRI(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitDatatypePropertyIRI) {
			listener.exitDatatypePropertyIRI(this);
		}
	}
}


export class OntologyDocumentContext extends ParserRuleContext {
	public ontology(): OntologyContext {
		return this.getRuleContext(0, OntologyContext);
	}
	public prefixDeclaration(): PrefixDeclarationContext[];
	public prefixDeclaration(i: number): PrefixDeclarationContext;
	public prefixDeclaration(i?: number): PrefixDeclarationContext | PrefixDeclarationContext[] {
		if (i === undefined) {
			return this.getRuleContexts(PrefixDeclarationContext);
		} else {
			return this.getRuleContext(i, PrefixDeclarationContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_ontologyDocument; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterOntologyDocument) {
			listener.enterOntologyDocument(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitOntologyDocument) {
			listener.exitOntologyDocument(this);
		}
	}
}


export class PrefixDeclarationContext extends ParserRuleContext {
	public PREFIX_LABEL(): TerminalNode { return this.getToken(MOSParser.PREFIX_LABEL, 0); }
	public PREFIX_NAME(): TerminalNode { return this.getToken(MOSParser.PREFIX_NAME, 0); }
	public FULL_IRI(): TerminalNode { return this.getToken(MOSParser.FULL_IRI, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_prefixDeclaration; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterPrefixDeclaration) {
			listener.enterPrefixDeclaration(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitPrefixDeclaration) {
			listener.exitPrefixDeclaration(this);
		}
	}
}


export class OntologyContext extends ParserRuleContext {
	public ONTOLOGY_LABEL(): TerminalNode { return this.getToken(MOSParser.ONTOLOGY_LABEL, 0); }
	public ontologyIri(): OntologyIriContext | undefined {
		return this.tryGetRuleContext(0, OntologyIriContext);
	}
	public imports(): ImportsContext[];
	public imports(i: number): ImportsContext;
	public imports(i?: number): ImportsContext | ImportsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ImportsContext);
		} else {
			return this.getRuleContext(i, ImportsContext);
		}
	}
	public annotations(): AnnotationsContext[];
	public annotations(i: number): AnnotationsContext;
	public annotations(i?: number): AnnotationsContext | AnnotationsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AnnotationsContext);
		} else {
			return this.getRuleContext(i, AnnotationsContext);
		}
	}
	public frame(): FrameContext[];
	public frame(i: number): FrameContext;
	public frame(i?: number): FrameContext | FrameContext[] {
		if (i === undefined) {
			return this.getRuleContexts(FrameContext);
		} else {
			return this.getRuleContext(i, FrameContext);
		}
	}
	public versionIri(): VersionIriContext | undefined {
		return this.tryGetRuleContext(0, VersionIriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_ontology; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterOntology) {
			listener.enterOntology(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitOntology) {
			listener.exitOntology(this);
		}
	}
}


export class OntologyIriContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_ontologyIri; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterOntologyIri) {
			listener.enterOntologyIri(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitOntologyIri) {
			listener.exitOntologyIri(this);
		}
	}
}


export class VersionIriContext extends ParserRuleContext {
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_versionIri; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterVersionIri) {
			listener.enterVersionIri(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitVersionIri) {
			listener.exitVersionIri(this);
		}
	}
}


export class ImportsContext extends ParserRuleContext {
	public IMPORT_LABEL(): TerminalNode { return this.getToken(MOSParser.IMPORT_LABEL, 0); }
	public iri(): IriContext {
		return this.getRuleContext(0, IriContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return MOSParser.RULE_imports; }
	// @Override
	public enterRule(listener: MOSListener): void {
		if (listener.enterImports) {
			listener.enterImports(this);
		}
	}
	// @Override
	public exitRule(listener: MOSListener): void {
		if (listener.exitImports) {
			listener.exitImports(this);
		}
	}
}


