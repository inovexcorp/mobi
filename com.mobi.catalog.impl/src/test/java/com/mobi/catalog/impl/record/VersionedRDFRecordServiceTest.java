package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class VersionedRDFRecordServiceTest extends OrmEnabledTestCase {

    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");

    private VersionedRDFRecordService recordService;
    private SimpleSesameTransformer transformer;
    private VersionedRDFRecord testRecord;
    private Branch branch;
    private Commit headCommit;
    private Difference difference;
    private User user;
    private DeleteActivity deleteActivity;

    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private RecordFactory recordFactory;

    @Mock
    private RepositoryConnection connection;

    @Mock
    private CatalogProvUtils provUtils;

    @Before
    public void setUp() throws Exception {

        recordService = new VersionedRDFRecordService();
        transformer = new SimpleSesameTransformer();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
        headCommit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(headCommit);
        branch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        Model deletions = MODEL_FACTORY.createModel();
        deletions.add(VALUE_FACTORY.createIRI("http://test.com#sub"), VALUE_FACTORY.createIRI(_Thing.description_IRI),
                VALUE_FACTORY.createLiteral("Description"));

        difference = new Difference.Builder()
                .additions(MODEL_FACTORY.createModel())
                .deletions(deletions)
                .build();

        testRecord = versionedRDFRecordFactory.createNew(testIRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(catalogId));
        testRecord.setBranch(Collections.singleton(branch));


        MockitoAnnotations.initMocks(this);
        when(utilsService.getExpectedObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(testRecord);
        when(utilsService.getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection))).thenReturn(branch);
        when(utilsService.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);
        doReturn(Stream.of(commitIRI).collect(Collectors.toList()))
                .when(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        when(utilsService.getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection))).thenReturn(headCommit);
        when(utilsService.getRevisionChanges(eq(commitIRI), eq(connection))).thenReturn(difference);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.setRecordFactory(recordFactory);
        recordService.setUtilsService(utilsService);
        recordService.setVf(VALUE_FACTORY);
        recordService.setProvUtils(provUtils);
    }

    /* export() */

    @Test
    public void exportUsingOutputStreamTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        VersionedRDFRecordExportConfig config = new VersionedRDFRecordExportConfig.Builder(os, RDFFormat.JSONLD, transformer).build();

        BatchExporter exporter = config.getBatchExporter();
        assertFalse(exporter.isActive());
        recordService.export(testIRI, config, connection);
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertTrue(outputModel.containsAll(difference.getAdditions()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getHeadCommitIRI(eq(branch));
        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getRevisionChanges(eq(commitIRI), eq(connection));
    }

    @Test
    public void exportUsingBatchExporterTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        VersionedRDFRecordExportConfig config = new VersionedRDFRecordExportConfig.Builder(exporter).build();

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        recordService.export(testIRI, config, connection);
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertTrue(outputModel.containsAll(difference.getAdditions()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getHeadCommitIRI(eq(branch));
        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getRevisionChanges(eq(commitIRI), eq(connection));
    }

    @Test
    public void exportRecordOnlyTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        VersionedRDFRecordExportConfig config = new VersionedRDFRecordExportConfig.Builder(exporter).writeVersionedData(false).build();

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        recordService.export(testIRI, config, connection);
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertFalse(outputModel.containsAll(branch.getModel()));
        assertFalse(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService, never()).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService, never()).getHeadCommitIRI(eq(branch));
        verify(utilsService, never()).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService, never()).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService, never()).getRevisionChanges(eq(commitIRI), eq(connection));
    }

    @Test
    public void exportSpecificBranch() throws Exception {
        Branch doNotWriteBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2"));
        doNotWriteBranch.setHead(headCommit);
        doNotWriteBranch.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        testRecord.addBranch(doNotWriteBranch);

        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        VersionedRDFRecordExportConfig config = new VersionedRDFRecordExportConfig.Builder(exporter).addBranchResource(branchIRI).build();

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        recordService.export(testIRI, config, connection);
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        testRecord.removeBranch(doNotWriteBranch);
        assertTrue(outputModel.containsAll(testRecord.getModel()));
        assertTrue(outputModel.containsAll(branch.getModel()));
        assertFalse(outputModel.containsAll(doNotWriteBranch.getModel()));
        assertTrue(outputModel.containsAll(difference.getDeletions()));

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getBranch(eq(testRecord), eq(branchIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getHeadCommitIRI(eq(branch));
        verify(utilsService).getCommitChain(eq(commitIRI), eq(false), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitIRI), any(OrmFactory.class), eq(connection));
        verify(utilsService).getRevisionChanges(eq(commitIRI), eq(connection));
    }
}
