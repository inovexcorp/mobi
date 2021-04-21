package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.config.rdf.export.RecordExportConfig;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RecordExportServiceImplTest extends OrmEnabledTestCase {
    private ValueFactory vf;
    private ModelFactory mf;

    private OrmFactory<Record> recordFactoryOrm = getRequiredOrmFactory(Record.class);
    private OrmFactory<UnversionedRecord> unversionedRecordFactoryOrm = getRequiredOrmFactory(UnversionedRecord.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactoryOrm = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Version> versionFactoryOrm = getRequiredOrmFactory(Version.class);
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
    private SesameTransformer transformer;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private BranchFactory branchFactory;

    @Mock
    private RecordFactory recordFactory;

    @Mock
    private VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Before
    public void setup() throws Exception {
        MockitoAnnotations.initMocks(this);

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
        when(catalogManager.getRecord(eq(catalogIRI), eq(unversionedRecordIRI), eq(recordFactory)))
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
                .additions(mf.createModel())
                .deletions(mf.createModel())
                .build();

        when(catalogManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(branchFactory)))
                .thenReturn(Optional.of(masterBranch));
        when(catalogManager.getCommitChain(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI)))
                .thenReturn(Stream.of(headCommit, baseCommit).collect(Collectors.toList()));
        when(catalogManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(masterHeadCommitIRI)))
                .thenReturn(Optional.of(headCommit));
        when(catalogManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(masterBranchIRI), eq(baseCommitIRI)))
                .thenReturn(Optional.of(baseCommit));
        when(catalogManager.getRevisionChanges(any(Resource.class))).thenReturn(difference);

        // Setup versionedRDFRecord second branch
        secondBranch = branchFactoryOrm.createNew(secondBranchIRI);
        secondCommit = commitFactoryOrm.createNew(secondHeadCommitIRI);
        baseCommit = commitFactoryOrm.createNew(baseCommitIRI);
        secondCommit.setBaseCommit(baseCommit);
        secondBranch.setHead(secondCommit);

        when(catalogManager.getRecord(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(recordFactory)))
                .thenReturn(Optional.of(versionedRDFRecord));
        when(catalogManager.getRecord(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(versionedRDFRecordFactory)))
                .thenReturn(Optional.of(versionedRDFRecord));
        when(catalogManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(branchFactory)))
                .thenReturn(Optional.of(secondBranch));
        when(catalogManager.getCommitChain(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI)))
                .thenReturn(Stream.of(secondCommit, baseCommit).collect(Collectors.toList()));
        when(catalogManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(secondHeadCommitIRI)))
                .thenReturn(Optional.of(secondCommit));
        when(catalogManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(secondBranchIRI), eq(baseCommitIRI)))
                .thenReturn(Optional.of(baseCommit));

        // Setup Tags/Versions
        tag1 = tagFactoryOrm.createNew(tag1IRI);
        tag1.setCommit(baseCommit);
        tag2 = tagFactoryOrm.createNew(tag2IRI);
        tag2.setCommit(secondCommit);
        when(catalogManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI))).thenReturn(Collections.emptySet());

        // General mock interactions
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);

        service.setVf(vf);
        service.setCatalogManager(catalogManager);
        service.setConfigProvider(configProvider);
        service.setTransformer(transformer);
        service.setBranchFactory(branchFactory);
        service.setRecordFactory(recordFactory);
        service.setVersionedRDFRecordFactory(versionedRDFRecordFactory);
    }

    @Test
    public void noRecordsInCatalogTest() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.emptySet());

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
        assertEquals(0, model.size());
    }

    @Test
    public void unversionedRecordInCatalogTest() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(unversionedRecordIRI));

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
        assertTrue(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(versionedRDFRecord.getModel()));
    }

    @Test
    public void unversionedRecordSpecifiedTest() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(unversionedRecordIRI));

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG)
                .records(Collections.singleton(unversionedRecordIRI.stringValue())).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
        assertTrue(model.containsAll(unversionedRecord.getModel()));
        assertFalse(model.containsAll(versionedRDFRecord.getModel()));
    }

    @Test
    public void versionedRDFRecordInCatalogOneBranchTest() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        versionedRDFRecord.addBranch(secondBranch);

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG)
                .records(Collections.singleton(versionedRDFRecordIRI.stringValue())).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG)
                .records(Collections.singleton(versionedRDFRecordIRI.stringValue())).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI))).thenReturn(Collections.singleton(tag1));

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getVersions(eq(catalogIRI), eq(versionedRDFRecordIRI)))
                .thenReturn(Stream.of(tag1, tag2).collect(Collectors.toSet()));

        versionedRDFRecord.addBranch(secondBranch);

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);

        Model model = Models.createModel("trig", Files.newInputStream(path), transformer);
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
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getRecord(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(recordFactory))).thenReturn(Optional.empty());

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);
    }

    @Test(expected = IllegalStateException.class)
    public void versionedRecordDoesNotExist() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getRecord(eq(catalogIRI), eq(versionedRDFRecordIRI), eq(versionedRDFRecordFactory))).thenReturn(Optional.empty());

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);
    }

    @Test(expected = IllegalStateException.class)
    public void branchDoesNotExist() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getBranch(eq(catalogIRI), eq(versionedRDFRecordIRI), any(Resource.class), eq(branchFactory))).thenReturn(Optional.empty());

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);
    }

    @Test(expected = IllegalStateException.class)
    public void commitDoesNotExist() throws Exception {
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(versionedRDFRecordIRI));
        when(catalogManager.getCommit(eq(catalogIRI), eq(versionedRDFRecordIRI), any(Resource.class), any(Resource.class))).thenReturn(Optional.empty());

        Path path = getFilePath();
        OutputStream os = Files.newOutputStream(path);
        RecordExportConfig exportConfig = new RecordExportConfig.Builder(os, RDFFormat.TRIG).build();
        service.export(exportConfig);
    }

    private Path getFilePath() throws Exception {
        File outputFile = tempFolder.newFile();
        return outputFile.toPath();
    }
}
