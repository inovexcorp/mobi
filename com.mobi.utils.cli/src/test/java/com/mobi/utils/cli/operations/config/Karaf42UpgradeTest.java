package com.mobi.utils.cli.operations.config;

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

import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.stream.Stream;

public class Karaf42UpgradeTest {
    private AutoCloseable closeable;
    private Karaf42Upgrade operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        operation = new Karaf42Upgrade();
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of("1.12;true",
                "1.13;false",
                "1.14;false",
                "1.15;false",
                "1.16;false",
                "1.17;false",
                "1.18;false",
                "1.19;false",
                "1.20;false",
                "1.21;false",
                "1.22;false",
                "2.0;false",
                "2.1;false",
                "2.2;false",
                "2.3;false",
                "2.4;false",
                "2.5;false"
        ).toList();
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void getExcludedFilesTest() {
        List<String> actualExcludedFiles = operation.getExcludedFiles();
        Assert.assertNotNull(actualExcludedFiles);
        Assert.assertEquals(37, actualExcludedFiles.size());
    }

}
