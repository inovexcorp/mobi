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

import com.mobi.rdf.orm.test.OrmEnabledTestCase;

public class UnversionedRecordServiceTest extends OrmEnabledTestCase {
//
//    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
//    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");
//
//    private SimpleUnversionedRecordService recordService;
//    private UnversionedRecord testRecord;
//    private User user;
//    private DeleteActivity deleteActivity;
//
//    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
//    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
//    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);
//    private OrmFactory<UnversionedRecord> recordFactory = getRequiredOrmFactory(UnversionedRecord.class);
//    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);
//
//    @Rule
//    public ExpectedException thrown = ExpectedException.none();
//
//    @Mock
//    private CatalogUtilsService utilsService;
//
//    @Mock
//    private RepositoryConnection connection;
//
//    @Mock
//    private CatalogProvUtils provUtils;
//
//    @Before
//    public void setUp() throws Exception {
//        recordService = new SimpleUnversionedRecordService();
//        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));
//
//        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));
//
//        testRecord = recordFactory.createNew(testIRI);
//        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
//        testRecord.setCatalog(catalogFactory.createNew(catalogId));
//        Set<Distribution> dists = new HashSet<>();
//        Distribution dist1 = distributionFactory.createNew(VALUE_FACTORY.createIRI("urn:dist1"));
//        Distribution dist2 = distributionFactory.createNew(VALUE_FACTORY.createIRI("urn:dist2"));
//        dists.add(dist1);
//        dists.add(dist2);
//        testRecord.setUnversionedDistribution(dists);
//
//        MockitoAnnotations.initMocks(this);
//        when(utilsService.optObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(Optional.of(testRecord));
//        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
//
//        injectOrmFactoryReferencesIntoService(recordService);
//        recordService.setUtilsService(utilsService);
//        recordService.setVf(VALUE_FACTORY);
//        recordService.setProvUtils(provUtils);
//    }
//
//    /* delete() */
//
//    @Test
//    public void deleteTest() throws Exception {
//        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.of(testRecord));
//
//        UnversionedRecord deletedRecord = recordService.delete(testIRI, user, connection);
//
//        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
//        verify(utilsService, times(2)).remove(any(Resource.class), eq(connection));
//        verify(utilsService).removeObject(eq(testRecord), eq(connection));
//        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
//        verify(provUtils).endDeleteActivity(eq(deleteActivity), eq(testRecord));
//        assertEquals(testRecord, deletedRecord);
//    }
//
//    @Test (expected = IllegalArgumentException.class)
//    public void deleteRecordDoesNotExistTest() throws Exception {
//        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.empty());
//
//        recordService.delete(testIRI, user, connection);
//
//        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
//    }
//
//    @Test
//    public void deleteRecordRemoveFails() throws Exception {
//        doThrow(RepositoryException.class).when(utilsService).removeObject(any(UnversionedRecord.class), any(RepositoryConnection.class));
//        thrown.expect(RepositoryException.class);
//
//        recordService.delete(testIRI, user, connection);
//        verify(provUtils).removeActivity(any(DeleteActivity.class));
//    }
//
//    @Test
//    public void getTypeIRITest() throws Exception {
//        assertEquals(UnversionedRecord.TYPE, recordService.getTypeIRI());
//    }
}