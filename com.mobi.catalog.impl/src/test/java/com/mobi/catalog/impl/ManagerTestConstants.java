package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.rdf.orm.Thing;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.List;

public class ManagerTestConstants {
    public static final ValueFactory VALUE_FACTORY = new ValidatingValueFactory();
    public static final String DELTAS = "https://mobi.com/deltas#";
    public static final String COMMITS = "http://mobi.com/test/commits#";
    public static final String BRANCHES = "http://mobi.com/test/branches#";
    public static final String RECORDS = "http://mobi.com/test/records#";
    public static final String REVISIONS = "https://mobi.com/test/revisions#";
    public static final IRI BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    public static final IRI CATALOG_DISTRIBUTED_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-distributed");
    public static final IRI CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-local");
    public static final IRI COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    public static final IRI COMMIT_NO_ADDITIONS_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit-no-additions");
    public static final IRI COMMIT_NO_DELETIONS_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit-no-deletions");
    public static final IRI DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    public static final IRI EMPTY_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#empty");
    public static final IRI IN_PROGRESS_COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit");
    public static final IRI IN_PROGRESS_COMMIT_NO_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit-no-record");
    public static final IRI LONE_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#lone-branch");
    public static final IRI LONE_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#lone-version");
    public static final IRI MASTER_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    public static final IRI MISSING_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#missing");
    public static final IRI NEW_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#new");
    public static final IRI RANDOM_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#random");
    public static final IRI RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record");
    public static final IRI SIMPLE_VERSIONED_RDF_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#simple-versioned-rdf-record");
    public static final IRI TAG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    public static final IRI UNVERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record");
    public static final IRI USER2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#user2");
    public static final IRI USER3_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#user3");
    public static final IRI USER_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#user-branch");
    public static final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#taken");
    public static final IRI VERSIONED_RDF_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record");
    public static final IRI VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-missing-branch");
    public static final IRI VERSIONED_RDF_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-no-catalog");
    public static final IRI VERSIONED_RDF_RECORD_NO_MASTER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-no-master");
    public static final IRI VERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record");
    public static final IRI VERSIONED_RECORD_MISSING_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record-missing-version");
    public static final IRI VERSIONED_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record-no-catalog");
    public static final IRI VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#version");

    // Constants for conflictBranches resource files
    public static final IRI CONFLICT_RECORD = VALUE_FACTORY.createIRI(RECORDS + "1f6e9afa-8999-4ec6-9b10-cd3eec126766");
    public static final IRI CONFLICT_MASTER = VALUE_FACTORY.createIRI(BRANCHES + "7efe8089-ab0e-421f-9f83-6b4302b69143");
    public static final IRI CONFLICT_B1 = VALUE_FACTORY.createIRI(BRANCHES + "17628f43-7a4e-4f20-9fa5-94107b40c893");
    public static final IRI CONFLICT_B2 = VALUE_FACTORY.createIRI(BRANCHES + "b5c4e58d-8e4f-4d0c-8593-9d3d62f02f7d");
    public static final IRI CONFLICT_B3 = VALUE_FACTORY.createIRI(BRANCHES + "00733b07-3309-4a47-943d-2b50fdd9c592");
    public static final IRI CONFLICT_B4 = VALUE_FACTORY.createIRI(BRANCHES + "505186a4-fedd-4ac9-9a04-8e0e9190bb13");
    public static final IRI CONFLICT_B5 = VALUE_FACTORY.createIRI(BRANCHES + "6687011d-7b4d-4f13-8884-232e3a0ff096");

    // conflictBranchesSetup.trig
    public static final IRI INITIAL_COMMIT = VALUE_FACTORY.createIRI(COMMITS + "b48c93b67469e70bfd055a1cf32bb902102834fc");
    public static final IRI INITIAL_COMMIT_GENERATED = VALUE_FACTORY.createIRI(REVISIONS + "576c1f58-e4b3-474a-a02b-8d2d166eecbc");
    public static final IRI INITIAL_COMMIT_INITIAL_REV = VALUE_FACTORY.createIRI(REVISIONS + "6fde93f9-ab73-4e99-8149-a023c1c7532d");

    public static final IRI B1_CHANGE_SUBPRED = VALUE_FACTORY.createIRI(COMMITS + "8240c71405d7bdd7365c460207e98ef74c895832");
    public static final IRI B1_CHANGE_SUBPRED_FW_REV = VALUE_FACTORY.createIRI(REVISIONS + "5cd1173a-e663-452a-bf4e-b12a0713e209");
    public static final IRI B2_CHANGE_SUBPRED = VALUE_FACTORY.createIRI(COMMITS + "f61f5321713e42f30e701fb2094e4278df7546ca");
    public static final IRI B3_CHANGE_DELETED_ENTITIES = VALUE_FACTORY.createIRI(COMMITS + "e51626992bbb51a95e712dcc1d76c7b1619e2953");
    public static final IRI B4_CHANGE_DUPLICATE_ADD_DEL = VALUE_FACTORY.createIRI(COMMITS + "05532d7199bb514cf2505deeb569c4009f9b7791");
    public static final IRI B5_CHANGE_DELETED_ENTITIES_MODIFIED = VALUE_FACTORY.createIRI(COMMITS + "9b7dd215de646cc1e58d8a927568ee025158a87f");
    public static final IRI DIFF_COMMIT_MASTER = VALUE_FACTORY.createIRI(COMMITS + "621a8ade67cc8112aa9a4fa27ac9696b5ed79c9d");
    public static final IRI DIFF_COMMIT_MASTER_REV = VALUE_FACTORY.createIRI(REVISIONS + "3e3cef92-42af-4f25-8463-1def1e404880");
    public static final IRI MASTER_CHANGE_DUPLICATE_ADD_DEL = VALUE_FACTORY.createIRI(COMMITS + "93c7d13a16eeb7eae404a0882a6d45c4d3fbb4ba");

    // conflictBranchesInitialMerge.trig
    public static final IRI B2_INTO_B1_SUBPRED = VALUE_FACTORY.createIRI(COMMITS + "47d1bc383281f3cb812c517c5a0dcdb97573aa83");
    public static final IRI B2_INTO_B1_SUBPRED_DISPLAY_REV = VALUE_FACTORY.createIRI(REVISIONS + "85ca5197-d658-497d-bfd1-a0976240a471");
    public static final IRI B2_INTO_B1_SUBPRED_GENERATED_REV = VALUE_FACTORY.createIRI(REVISIONS + "1bb43ed9-4de5-405f-9468-3dc52686f64f");
    public static final IRI MASTER_INTO_B4_DUPLICATE = VALUE_FACTORY.createIRI(COMMITS + "67c0329bd778b306850016e460c5599ca862a89b");
    public static final IRI MASTER_INTO_B4_DUPLICATE_DISPLAY_REV = VALUE_FACTORY.createIRI(REVISIONS + "ad464c33-82dd-4330-b088-e945f367efe5");
    public static final IRI MASTER_INTO_B4_DUPLICATE_GENERATED_REV = VALUE_FACTORY.createIRI(REVISIONS + "216df887-17bd-41ac-9e58-630da941a466");
    public static final IRI B3_INTO_B5_DELETED = VALUE_FACTORY.createIRI(COMMITS + "d0ff0ed204ff67fe172a35067a1e34496a1ab06e");

    // b1IntoMaster.trig
    public static final IRI FINAL_B1_INTO_MASTER = VALUE_FACTORY.createIRI(COMMITS + "cc5818f6-b326-419d-8dc6-aaaf65298eff");
    public static final IRI FINAL_B1_INTO_MASTER_DISPLAY_REV = VALUE_FACTORY.createIRI(REVISIONS + "48bf6523-cfd6-4f82-a36e-c5f2c7f439a0");
    // b4IntoMaster.trig
    public static final IRI FINAL_B4_INTO_MASTER = VALUE_FACTORY.createIRI(COMMITS + "47d08413-1488-4ce2-a054-08eecf585417");
    // b5IntoMaster.trig
    public static final IRI FINAL_B5_INTO_MASTER = VALUE_FACTORY.createIRI(COMMITS + "8fb2515d-5b10-4bc9-ac0b-12cb6794dbcc");

    // b1/b2 changes
    public static final Statement B1_ADD = VALUE_FACTORY.createStatement(DCTERMS.AGENT, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A resource that acts or has the power to act. b1", "en"));
    public static final Statement B2_ADD = VALUE_FACTORY.createStatement(DCTERMS.AGENT, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A resource that acts or has the power to act. b2", "en"));
    public static final Statement B1_B2_DEL = VALUE_FACTORY.createStatement(DCTERMS.AGENT, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A resource that acts or has the power to act.", "en"));

    // master/b4 changes
    public static final Statement M_B4_DUP_ADD = VALUE_FACTORY.createStatement(DCTERMS.METHOD_OF_ACCRUAL, DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("This is a duplicate addition."));
    public static final Statement M_B4_DUP_DEL = VALUE_FACTORY.createStatement(DCTERMS.METHOD_OF_INSTRUCTION, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A process that is used to engender knowledge, attitudes, and skills.", "en"));

    /**
     * Retrieves the DCTERMS Modified Value from a {@link Thing}
     * @param property A {@link Thing} to retrieve the Modified value from
     * @return The DCTERMS Modified value
     */
    public static String getModifiedIriValue(Thing property) {
        return property.getProperty(DCTERMS.MODIFIED).get().toString();
    }

    /**
     * Creates a model from the provided array of statements.
     * @param mf The ModelFactory to use
     * @param statements The statements to add to the model
     * @return The model with statements
     */
    public static Model getModelFromStatements(ModelFactory mf, Statement... statements) {
        Model model = mf.createEmptyModel();
        model.addAll(List.of(statements));
        return model;
    }
}
