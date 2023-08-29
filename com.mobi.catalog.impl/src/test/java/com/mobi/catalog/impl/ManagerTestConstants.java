package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.rdf.orm.Thing;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;

public class ManagerTestConstants {
    public static final ValueFactory VALUE_FACTORY = new ValidatingValueFactory();
    public static final String ADDITIONS = "https://mobi.com/additions#";
    public static final String COMMITS = "http://mobi.com/test/commits#";
    public static final String DELETIONS = "https://mobi.com/deletions#";
    public static final String GRAPHS = "http://mobi.com/test/graphs#";
    public static final String RECORDS = "http://mobi.com/test/records#";
    public static final String REVISIONS = "http://mobi.com/test/revisions#";
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
    public static final IRI OWL_THING = VALUE_FACTORY.createIRI(Thing.TYPE);
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

    /**
     * Retrieves the DCTERMS Modified Value from a {@link Thing}
     * @param property A {@link Thing} to retrieve the Modified value from
     * @return The DCTERMS Modified value
     */
    public static String getModifiedIriValue(Thing property) {
        return property.getProperty(DCTERMS.MODIFIED).get().toString();
    }
}
