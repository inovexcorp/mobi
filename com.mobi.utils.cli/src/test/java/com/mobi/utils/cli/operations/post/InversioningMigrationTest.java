package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class InversioningMigrationTest {
    private AutoCloseable closeable;
    private ValueFactory vf;
    private MemoryRepositoryWrapper systemRepo;
    private MemoryRepositoryWrapper tempRepo;

    @Mock
    private CatalogConfigProvider configProvider;

    private InversioningMigration operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();
        systemRepo = new MemoryRepositoryWrapper();
        systemRepo.setDelegate(new SailRepository(new MemoryStore()));

        tempRepo = new MemoryRepositoryWrapper();
        tempRepo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(configProvider.getRepository()).thenReturn(systemRepo);

        operation = new InversioningMigration();
        operation.configProvider = configProvider;
        operation.tempRepo = tempRepo;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(configProvider);
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of(
                "1.12;true",
                "1.13;true",
                "1.14;true",
                "1.15;true",
                "1.16;true",
                "1.17;true",
                "1.18;true",
                "1.19;true",
                "1.20;true",
                "1.21;true",
                "1.22;true",
                "2.0;true",
                "2.1;true",
                "2.2;true",
                "2.3;true",
                "2.4;true",
                "2.5;true",
                "3.0;true",
                "3.1;true",
                "3.2;true",
                "4.0;false"
        ).collect(Collectors.toUnmodifiableList());
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }
}
