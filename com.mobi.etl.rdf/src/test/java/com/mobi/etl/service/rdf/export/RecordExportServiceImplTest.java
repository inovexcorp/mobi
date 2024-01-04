package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.config.rdf.export.RecordExportConfig;
import com.mobi.persistence.utils.Models;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RecordExportServiceImplTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private ValueFactory vf;
    private ModelFactory mf;

    private OrmFactory<UnversionedRecord> unversionedRecordFactoryOrm = getRequiredOrmFactory(UnversionedRecord.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactoryOrm = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Tag> tagFactoryOrm = getRequiredOrmFactory(Tag.class);
    private OrmFactory<Branch> branchFactoryOrm = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactoryOrm = getRequiredOrmFactory(Commit.class);

    private UnversionedRecord unversionedRecord;
    private VersionedRDFRecord versionedRDFRecord;
    private IRI catalogIRI;
    private Resource unversionedRecordIRI;
    private Resource versionedRDFRecordIRI;
    private Resource masterBranchIRI;
    private Resource secondBranchIRI;
    private Resource masterHeadCommitIRI;
    private Resource secondHeadCommitIRI;
    private Resource baseCommitIRI;
    private Resource tag1IRI;
    private Resource tag2IRI;

    private Branch masterBranch;
    private Branch secondBranch;
    private Commit headCommit;
    private Commit secondCommit;
    private Commit baseCommit;
    private Tag tag1;
    private Tag tag2;

    private RecordExportServiceImpl service;

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private RecordManager recordManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private VersionManager versionManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private BranchFactory branchFactory;

    @Mock
    private RecordFactory recordFactory;

    @Mock
    private VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection mockConn;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        service = new RecordExportServiceImpl();
        vf = VALUE_FACTORY;
        mf = MODEL_FACTORY;
        catalogIRI = vf.createIRI("http://mobi.com/catalogs#local");
        versionedRDFRecordIRI = vf.createIRI("http://mobi.com/catalogs#versionedRDFTestRecord");
        unversionedRecordIRI = vf.createIRI("http://mobi.com/catalogs#unversionedTestRecord");
        masterBranchIRI = vf.createIRI("http://mobi.com/catalogs#masterBranch");
        secondBranchIRI = vf.createIRI("http://mobi.com/catalogs#secondBranch");
        masterHeadCommitIRI = vf.createIRI("http://mobi.com/catalogs#masterHeadCommit");
        secondHeadCommitIRI = vf.createIRI("http://mobi.com/catalogs#secondHeadCommit");
        baseCommitIRI = vf.createIRI("http://mobi.com/catalogs#baseCommit");
        tag1IRI = vf.createIRI("http://mobi.com/catalogs#tag1");
        tag2IRI = vf.createIRI("http://mobi.com/catalogs#tag2");

        // Setup unversionedRecord
        unversionedRecord = unversionedRecordFactoryOrm.createNew(unversionedRecordIRI);
        when(recordManager.getRecordOpt(eq(catalogIRI), eq(unversionedRecordIRI), eq(recordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(unversionedRecord));

        // Setup versionedRDFRecord master branch
        versionedRDFRecord = versionedRDFRecordFactoryOrm.createNew(versionedRDFRecordIRI);
        masterBranch = branchFactoryOrm.createNew(masterBranchIRI);
        headCommit = commitFactoryOrm.createNew(masterHeadCommitIRI);
        baseCommit = commitFactoryOrm.createNew(baseCommitIRI);
        headCommit.setBaseCommit(baseCommit);
        masterBranch.setHead(headCommit);
        versionedRDFRecord.setMasterBranch(masterBranch);
        versionedRDFRecord.setBranch(Collections.singleton(masterBranch));
        Difference difference = new Difference.Builder()
                .additions(mf.createEmptyModel())
                .deletions(mf.createEmptyModel())
                .build();

        when(branchManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(branchFactory), any(RepositoryConnection.class)))
                .thenReturn(masterBranch);
        when(commitManager.getCommitChain(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), any(RepositoryConnection.class)))
                .thenReturn(Stream.of(headCommit, baseCommit).collect(Collectors.toList()));
        when(commitManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(masterHeadCommitIRI), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(headCommit));
        when(commitManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(baseCommitIRI), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(baseCommit));
        when(differenceManager.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);

        // Setup versionedRDFRecord second branch
        secondBranch = branchFactoryOrm.createNew(secondBranchIRI);
        secondCommit = commitFactoryOrm.createNew(secondHeadCommitIRI);
        baseCommit = commitFactoryOrm.createNew(baseCommitIRI);
        secondCommit.setBaseCommit(baseCommit);
        secondBranch.setHead(secondCommit);

        when(recordManager.getRecordOpt(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(recordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(versionedRDFRecord));
        when(recordManager.getRecordOpt(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(versionedRDFRecord));
        when(branchManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(branchFactory), any(RepositoryConnection.class)))
                .thenReturn(secondBranch);
        when(commitManager.getCommitChain(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), any(RepositoryConnection.class)))
                .thenReturn(Stream.of(secondCommit, baseCommit).collect(Collectors.toList()));
        when(commitManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(secondHeadCommitIRI), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(secondCommit));
        when(commitManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(baseCommitIRI), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(baseCommit));

        // Setup Tags/Versions
        tag1 = tagFactoryOrm.createNew(tag1IRI);
        tag1.setCommit(baseCommit);
        tag2 = tagFactoryOrm.createNew(tag2IRI);
        tag2.setCommit(secondCommit);
        when(versionManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI), any(RepositoryConnection.class))).thenReturn(Collections.emptySet());

        // General mock interactions
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(mockConn);

        service.recordManager = recordManager;
        service.branchManager = branchManager;
        service.commitManager = commitManager;
        service.versionManager = versionManager;
        service.commitManager = commitManager;
        service.differenceManager = differenceManager;
        service.configProvider = configProvider;
        service.branchFactory = branchFactory;
        service.recordFactory = recordFactory;
        service.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void noRecordsInCatalogTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.emptySet());

        Model model = callExportAndGetModel();
        assertEquals(0, model.size());
    }

    @Test
    public void unversionedRecordInCatalogTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(unversionedRecordIRI));

        Model model = callExportAndGetModel();
        assertTrue(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(versionedRDFRecord.getModel()));
    }

    @Test
    public void unversionedRecordSpecifiedTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(unversionedRecordIRI));

        Model model = callExportAndGetModel(unversionedRecordIRI);
        assertTrue(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(versionedRDFRecord.getModel()));
    }

    @Test
    public void versionedRDFRecordInCatalogOneBranchTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));

        Model model = callExportAndGetModel();
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(tag1.getModel()));
        assertFalse(model.containsAll(tag2.getModel()));
    }

    @Test
    public void versionedRDFRecordInCatalogTwoBranchesTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        versionedRDFRecord.addBranch(secondBranch);

        Model model = callExportAndGetModel();
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertTrue(model.containsAll(secondBranch.getModel()));
        assertTrue(model.containsAll(secondCommit.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(tag1.getModel()));
        assertFalse(model.containsAll(tag2.getModel()));
    }

    @Test
    public void versionedRDFRecordSpecifiedOneBranchTest() throws Exception {
        Model model = callExportAndGetModel(versionedRDFRecordIRI);
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(tag1.getModel()));
        assertFalse(model.containsAll(tag2.getModel()));
    }

    @Test
    public void versionedRDFRecordSpecifiedTwoBranchesTest() throws Exception {
        versionedRDFRecord.addBranch(secondBranch);

        Model model = callExportAndGetModel(versionedRDFRecordIRI);
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertTrue(model.containsAll(secondBranch.getModel()));
        assertTrue(model.containsAll(secondCommit.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(tag1.getModel()));
        assertFalse(model.containsAll(tag2.getModel()));
    }

    @Test
    public void versionedRDFRecordOneBranchTagTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(versionManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI), any(RepositoryConnection.class))).thenReturn(Collections.singleton(tag1));

        Model model = callExportAndGetModel();
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertTrue(model.containsAll(tag1.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(tag2.getModel()));
    }

    @Test
    public void versionedRDFRecordTwoBranchesTagsTest() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(versionManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI), any(RepositoryConnection.class)))
                .thenReturn(Stream.of(tag1, tag2).collect(Collectors.toSet()));

        versionedRDFRecord.addBranch(secondBranch);

        Model model = callExportAndGetModel();
        assertTrue(model.containsAll(baseCommit.getModel()));
        assertTrue(model.containsAll(headCommit.getModel()));
        assertTrue(model.containsAll(masterBranch.getModel()));
        assertTrue(model.containsAll(versionedRDFRecord.getModel()));
        assertTrue(model.containsAll(secondBranch.getModel()));
        assertTrue(model.containsAll(secondCommit.getModel()));
        assertTrue(model.containsAll(tag1.getModel()));
        assertTrue(model.containsAll(tag2.getModel()));
        assertFalse(model.containsAll(unversionedRecord.getModel()));
    }

    @Test(expected = IllegalStateException.class)
    public void recordDoesNotExist() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(recordManager.getRecordOpt(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(recordFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        callExportAndGetModel();
    }

    @Test(expected = IllegalStateException.class)
    public void versionedRecordDoesNotExist() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(recordManager.getRecordOpt(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenThrow(new IllegalStateException());

        callExportAndGetModel();
    }

    @Test(expected = IllegalStateException.class)
    public void branchDoesNotExist() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(branchManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenThrow(new IllegalStateException());

        callExportAndGetModel();
    }

    @Test(expected = IllegalStateException.class)
    public void commitDoesNotExist() throws Exception {
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(commitManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        callExportAndGetModel();
    }

    private Model callExportAndGetModel(Resource... recordsToExport) throws Exception {
        Path path = tempFolder.newFile().toPath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig.Builder configBuilder = new RecordExportConfig.Builder(os, RDFFormat.TRIG);
        if (recordsToExport.length > 0) {
            Set<String> records = Stream.of(recordsToExport).map(Resource::stringValue).collect(Collectors.toSet());
            configBuilder.records(records);
        }
        service.export(configBuilder.build());
        return Models.createModel("trig", Files.newInputStream(path)).getModel();
    }
}
