package com.mobi.platform.config.impl.application;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.when;

import com.mobi.platform.config.api.application.ApplicationWrapper;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

public class SimpleApplicationManagerTest {
    private AutoCloseable closeable;
    private SimpleApplicationManager manager;

    private static final String ID = "id";

    @Mock
    private ApplicationWrapper applicationWrapper;

    @Mock
    private Application application;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        when(applicationWrapper.getId()).thenReturn(ID);
        when(applicationWrapper.getApplication()).thenReturn(application);

        manager = new SimpleApplicationManager();
        manager.addApplication(applicationWrapper);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void applicationExistsTest() throws Exception {
        assertTrue(manager.applicationExists(ID));
        assertFalse(manager.applicationExists("error"));
    }

    @Test
    public void getApplicationTest() throws Exception {
        Optional<Application> result = manager.getApplication(ID);
        assertTrue(result.isPresent());
        assertEquals(application, result.get());
    }

    @Test
    public void getApplicationThatDoesNotExistTest() throws Exception {
        Optional<Application> result = manager.getApplication("error");
        assertFalse(result.isPresent());
    }
}
